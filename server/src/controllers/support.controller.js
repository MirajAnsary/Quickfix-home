import { Booking, SupportTicket, nextNumber } from '../models/index.js';
import { ApiError } from '../utils/http.js';

// POST /api/support/tickets
export async function createTicket(req, res) {
  const { subject, message, bookingId } = req.body;
  if (bookingId && !(await Booking.exists({ _id: bookingId, customer: req.user._id }))) {
    throw new ApiError(404, 'Booking not found.');
  }
  const openCount = await SupportTicket.countDocuments({ user: req.user._id, status: { $ne: 'resolved' } });
  if (openCount >= 10) throw new ApiError(400, 'You have 10 open tickets. Please wait for a reply.');
  const ticket = await SupportTicket.create({ ticketNo: await nextNumber('TKT'), user: req.user._id, booking: bookingId, subject, message });
  res.status(201).json({ ticket });
}

// GET /api/support/tickets/mine
export async function myTickets(req, res) {
  const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ tickets });
}
