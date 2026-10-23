import { Invoice } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { paginate } from '../utils/format.js';
import { streamInvoicePdf } from '../services/invoicePdf.service.js';

// GET /api/invoices/mine
export async function myInvoices(req, res) {
  const { page, limit, skip } = paginate(req.query);
  const filter = { customer: req.user._id };
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'booking', select: 'bookingNo service', populate: { path: 'service', select: 'name' } })
      .lean(),
    Invoice.countDocuments(filter),
  ]);
  res.json({ invoices, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

// GET /api/invoices/:id/pdf — owner customer, the job's technician, or admin
export async function invoicePdf(req, res) {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'fullName phone email')
    .populate({ path: 'booking', select: 'bookingNo service address technician', populate: { path: 'service', select: 'name' } })
    .lean();
  const uid = String(req.user._id);
  const allowed =
    invoice &&
    (req.user.role === 'admin' || String(invoice.customer?._id) === uid || String(invoice.booking?.technician) === uid);
  if (!allowed) throw new ApiError(404, 'Invoice not found.');
  streamInvoicePdf(res, invoice);
}
