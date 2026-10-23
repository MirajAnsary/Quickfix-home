import crypto from 'node:crypto';
import { Booking, Invoice, Payment } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { paginate } from '../utils/format.js';

const razorpayReady = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

async function markInvoicePaid(invoiceId, when) {
  await Invoice.updateOne({ _id: invoiceId, status: 'unpaid' }, { status: 'paid', paidAt: when });
}

// GET /api/payments/mine
export async function myPayments(req, res) {
  const { page, limit, skip } = paginate(req.query);
  const filter = { customer: req.user._id, status: { $ne: 'created' } }; // hide abandoned checkouts
  if (req.query.method) filter.method = req.query.method;
  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('invoice', 'invoiceNo').select('-razorpayOrderId').lean(),
    Payment.countDocuments(filter),
  ]);
  res.json({ payments, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

// POST /api/payments/razorpay/order (customer)
export async function createRazorpayOrder(req, res) {
  if (!razorpayReady()) throw new ApiError(503, 'Online payment is not set up yet. Please pay in cash to the technician.');
  const invoice = await Invoice.findOne({ _id: req.body.invoiceId, customer: req.user._id });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (invoice.status === 'paid') throw new ApiError(400, 'This invoice is already paid.');

  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');
  const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(invoice.total * 100), // paise, taken from the database
      currency: 'INR',
      receipt: invoice.invoiceNo,
      notes: { invoiceId: String(invoice._id) },
    }),
  });
  if (!rzRes.ok) {
    console.error(`[razorpay] order creation failed with HTTP ${rzRes.status}`);
    throw new ApiError(502, 'Could not start the online payment. Please try again.');
  }
  const order = await rzRes.json();

  await Payment.create({
    invoice: invoice._id,
    booking: invoice.booking,
    customer: req.user._id,
    amount: invoice.total,
    method: 'razorpay',
    status: 'created',
    razorpayOrderId: order.id,
  });

  res.json({
    keyId: env.razorpay.keyId, // public key id — safe to share
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    invoiceNo: invoice.invoiceNo,
    prefill: { name: req.user.fullName, email: req.user.email, contact: `+91${req.user.phone}` },
  });
}

// POST /api/payments/razorpay/verify (customer)
export async function verifyRazorpayPayment(req, res) {
  if (!razorpayReady()) throw new ApiError(503, 'Online payment is not set up.');
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: orderId, customer: req.user._id });
  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.status === 'paid') return res.json({ message: 'Payment already confirmed.', payment });

  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.toLowerCase()));
  if (!valid) {
    payment.status = 'failed';
    await payment.save();
    throw new ApiError(400, 'Payment could not be verified. If money was deducted, contact support with your payment ID.');
  }

  payment.status = 'paid';
  payment.razorpayPaymentId = paymentId;
  payment.paidAt = new Date();
  await payment.save();
  await markInvoicePaid(payment.invoice, payment.paidAt);
  return res.json({ message: 'Payment successful.', payment });
}

// POST /api/payments/cash (assigned technician or admin)
export async function recordCashPayment(req, res) {
  const invoice = await Invoice.findById(req.body.invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (req.user.role === 'technician') {
    const booking = await Booking.findOne({ _id: invoice.booking, technician: req.user._id }).select('_id');
    if (!booking) throw new ApiError(404, 'Invoice not found.');
  }
  if (invoice.status === 'paid') throw new ApiError(400, 'This invoice is already paid.');

  const now = new Date();
  const payment = await Payment.create({
    invoice: invoice._id,
    booking: invoice.booking,
    customer: invoice.customer,
    amount: invoice.total,
    method: 'cash',
    status: 'paid',
    collectedBy: req.user._id,
    paidAt: now,
  });
  await markInvoicePaid(invoice._id, now);
  res.status(201).json({ message: 'Cash payment recorded.', payment });
}
