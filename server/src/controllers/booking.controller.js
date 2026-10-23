import { Address, Booking, Invoice, Payment, Quotation, Review, Service, nextNumber } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { paginate, startOfTodayIST } from '../utils/format.js';

export const BOOKING_POPULATE = [
  { path: 'service', select: 'name slug startingPrice' },
  { path: 'technician', select: 'fullName phone' },
];
const ACTIVE = ['pending', 'assigned', 'in_progress'];
const MAX_DAYS_AHEAD = 30;

// POST /api/bookings
export async function createBooking(req, res) {
  const { serviceId, addressId, scheduledDate, timeSlot, issueDescription } = req.body;
  const [service, address] = await Promise.all([
    Service.findOne({ _id: serviceId, isActive: true }),
    Address.findOne({ _id: addressId, user: req.user._id }),
  ]);
  if (!service) throw new ApiError(404, 'This service is not available.');
  if (!address) throw new ApiError(404, 'Address not found.', { fields: { addressId: 'Choose one of your saved addresses.' } });

  const date = new Date(`${scheduledDate}T00:00:00+05:30`);
  const today = startOfTodayIST();
  const max = new Date(today.getTime() + MAX_DAYS_AHEAD * 86400000);
  if (Number.isNaN(date.getTime()) || date < today || date > max) {
    throw new ApiError(400, `Choose a date within the next ${MAX_DAYS_AHEAD} days.`, { fields: { scheduledDate: 'Choose a valid date.' } });
  }

  // Simple abuse guard: a customer cannot hold too many open bookings at once.
  const open = await Booking.countDocuments({ customer: req.user._id, status: { $in: ACTIVE } });
  if (open >= 10) throw new ApiError(400, 'You already have 10 open bookings. Please wait for them to finish or cancel some.');

  const { label, line1, line2, landmark, city, district, state, pincode, contactPhone } = address;
  const booking = await Booking.create({
    bookingNo: await nextNumber('QF'),
    customer: req.user._id,
    service: service._id,
    address: { label, line1, line2, landmark, city, district, state, pincode, contactPhone },
    addressRef: address._id,
    scheduledDate: date,
    timeSlot,
    issueDescription,
    estimatedPrice: service.startingPrice,
    statusHistory: [{ status: 'pending', by: req.user._id, note: 'Booking created' }],
  });
  await booking.populate(BOOKING_POPULATE);
  res.status(201).json({ booking });
}

// GET /api/bookings/mine
export async function myBookings(req, res) {
  const { page, limit, skip } = paginate(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status === 'active') filter.status = { $in: ACTIVE };
  else if (req.query.status) filter.status = req.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE).select('-statusHistory').lean(),
    Booking.countDocuments(filter),
  ]);
  const reviewed = await Review.find({ booking: { $in: bookings.map((b) => b._id) } }).select('booking').lean();
  const set = new Set(reviewed.map((r) => String(r.booking)));
  for (const b of bookings) b.hasReview = set.has(String(b._id));

  res.json({ bookings, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

// GET /api/bookings/stats
export async function myStats(req, res) {
  const [byStatus, spent] = await Promise.all([
    Booking.aggregate([{ $match: { customer: req.user._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { customer: req.user._id, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const c = Object.fromEntries(byStatus.map((x) => [x._id, x.n]));
  res.json({
    stats: {
      total: byStatus.reduce((s, x) => s + x.n, 0),
      completed: c.completed || 0,
      active: (c.pending || 0) + (c.assigned || 0) + (c.in_progress || 0),
      cancelled: c.cancelled || 0,
      totalSpent: spent[0]?.total || 0,
    },
  });
}

// GET /api/bookings/:id — customer (own), assigned technician, or admin
export async function getBooking(req, res) {
  const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE).populate('customer', 'fullName phone').lean();
  const uid = String(req.user._id);
  const allowed =
    booking &&
    (req.user.role === 'admin' || String(booking.customer?._id) === uid || (booking.technician && String(booking.technician._id) === uid));
  if (!allowed) throw new ApiError(404, 'Booking not found.'); // 404, not 403: don't confirm it exists

  const [quotations, invoice, review] = await Promise.all([
    Quotation.find({ booking: booking._id }).sort({ createdAt: -1 }).lean(),
    Invoice.findOne({ booking: booking._id }).lean(),
    Review.findOne({ booking: booking._id }).lean(),
  ]);
  res.json({ booking, quotations, invoice, review });
}

// PATCH /api/bookings/:id/cancel
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (!['pending', 'assigned'].includes(booking.status)) throw new ApiError(400, 'This booking can no longer be cancelled online. Please contact support.');
  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason;
  booking.statusHistory.push({ status: 'cancelled', by: req.user._id, note: req.body.reason || 'Cancelled by customer' });
  await booking.save();
  await Quotation.updateMany({ booking: booking._id, status: 'pending' }, { status: 'superseded' });
  res.json({ booking });
}
