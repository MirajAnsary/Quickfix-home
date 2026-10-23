import { Booking, Invoice, Quotation, nextNumber } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { round2 } from '../utils/format.js';

const NEXT = { assigned: ['in_progress'], in_progress: ['completed'] };

// GET /api/technician/jobs
export async function myJobs(req, res) {
  const filter = { technician: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const jobs = await Booking.find(filter)
    .sort({ scheduledDate: 1, createdAt: -1 })
    .limit(100)
    .populate('service', 'name slug')
    .populate('customer', 'fullName phone')
    .select('-statusHistory')
    .lean();

  const ids = jobs.map((j) => j._id);
  const [quotes, invoices] = await Promise.all([
    Quotation.find({ booking: { $in: ids } }).sort({ createdAt: -1 }).lean(),
    Invoice.find({ booking: { $in: ids } }).select('invoiceNo total status booking').lean(),
  ]);
  for (const j of jobs) {
    j.latestQuotation = quotes.find((q) => String(q.booking) === String(j._id)) || null;
    j.invoice = invoices.find((i) => String(i.booking) === String(j._id)) || null;
  }
  res.json({ jobs });
}

// PATCH /api/technician/jobs/:id/status
export async function updateJobStatus(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, technician: req.user._id }).populate('service', 'name');
  if (!booking) throw new ApiError(404, 'Job not found.');
  const { status, note } = req.body;
  if (!(NEXT[booking.status] || []).includes(status)) throw new ApiError(400, `A ${booking.status.replace('_', ' ')} job cannot move to ${status.replace('_', ' ')}.`);

  let invoice = null;
  if (status === 'completed') {
    // Price must be agreed by the customer before the job can be closed and billed.
    const quote = await Quotation.findOne({ booking: booking._id, status: 'accepted' });
    if (!quote) throw new ApiError(400, 'The customer must accept a quotation before you can complete the job.');
    const subtotal = round2(quote.total);
    const taxRate = env.gstRatePercent;
    const taxAmount = round2((subtotal * taxRate) / 100);
    invoice = await Invoice.create({
      invoiceNo: await nextNumber('INV'),
      booking: booking._id,
      customer: booking.customer,
      technician: req.user._id,
      quotation: quote._id,
      items: quote.items.map((i) => ({ description: i.description, amount: i.amount })),
      subtotal,
      taxRate,
      taxAmount,
      total: round2(subtotal + taxAmount),
    });
    booking.completedAt = new Date();
  }

  booking.status = status;
  booking.statusHistory.push({ status, by: req.user._id, note });
  await booking.save();
  res.json({ booking, invoice });
}
