import { Booking, Quotation } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { round2 } from '../utils/format.js';

// POST /api/quotations (technician assigned to the booking)
export async function createQuotation(req, res) {
  const { bookingId, items, note } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, technician: req.user._id });
  if (!booking) throw new ApiError(404, 'Job not found.');
  if (!['assigned', 'in_progress'].includes(booking.status)) throw new ApiError(400, 'You can only quote on assigned or in-progress jobs.');
  if (await Quotation.exists({ booking: booking._id, status: 'accepted' })) throw new ApiError(400, 'The customer already accepted a quotation for this job.');

  await Quotation.updateMany({ booking: booking._id, status: 'pending' }, { status: 'superseded' });
  const total = round2(items.reduce((s, i) => s + i.amount, 0)); // computed on the server, never trusted from the client
  const quotation = await Quotation.create({ booking: booking._id, technician: req.user._id, items, total, note });
  booking.statusHistory.push({ status: booking.status, by: req.user._id, note: `Quotation sent: Rs. ${total}` });
  await booking.save();
  res.status(201).json({ quotation });
}

// PATCH /api/quotations/:id/respond (customer who owns the booking)
export async function respondQuotation(req, res) {
  const quotation = await Quotation.findById(req.params.id).populate('booking');
  if (!quotation || String(quotation.booking?.customer) !== String(req.user._id)) throw new ApiError(404, 'Quotation not found.');
  if (quotation.status !== 'pending') throw new ApiError(400, 'This quotation is no longer open.');
  if (!['assigned', 'in_progress'].includes(quotation.booking.status)) throw new ApiError(400, 'This booking is closed.');

  const accepted = req.body.action === 'accept';
  quotation.status = accepted ? 'accepted' : 'rejected';
  quotation.respondedAt = new Date();
  await quotation.save();

  const booking = quotation.booking;
  booking.statusHistory.push({ status: booking.status, by: req.user._id, note: `Quotation ${accepted ? 'accepted' : 'rejected'} by customer` });
  await booking.save();

  res.json({ quotation: { ...quotation.toObject(), booking: booking._id } });
}
