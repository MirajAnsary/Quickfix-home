import { Booking, Payment, Quotation, Service, User } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { paginate } from '../utils/format.js';
import { BOOKING_POPULATE } from './booking.controller.js';

// GET /api/admin/stats
export async function stats(_req, res) {
  const [customers, technicians, byStatus, revenue] = await Promise.all([
    User.countDocuments({ role: 'customer', isVerified: true }),
    User.countDocuments({ role: 'technician' }),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const c = Object.fromEntries(byStatus.map((x) => [x._id, x.n]));
  res.json({
    stats: {
      customers,
      technicians,
      bookings: {
        total: byStatus.reduce((s, x) => s + x.n, 0),
        pending: c.pending || 0,
        active: (c.assigned || 0) + (c.in_progress || 0),
        completed: c.completed || 0,
        cancelled: c.cancelled || 0,
      },
      revenue: revenue[0]?.total || 0,
    },
  });
}

// GET /api/admin/users?role=
export async function listUsers(req, res) {
  const { page, limit, skip } = paginate(req.query);
  const filter = req.query.role ? { role: req.query.role } : {};
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ users, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

// POST /api/admin/technicians
export async function createTechnician(req, res) {
  const { fullName, phone, email, password, skills } = req.body;
  if (await User.exists({ $or: [{ email }, { phone }] })) throw new ApiError(409, 'A user with this email or phone already exists.');
  const user = await User.create({ fullName, phone, email, password, skills, role: 'technician', isVerified: true });
  res.status(201).json({ user });
}

// PATCH /api/admin/users/:id/status
export async function setUserStatus(req, res) {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot disable your own account.');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be disabled here.');
  user.isActive = req.body.isActive;
  if (!user.isActive) user.tokenVersion += 1; // log them out everywhere
  await user.save();
  res.json({ user });
}

// GET /api/admin/bookings?status=
export async function listBookings(req, res) {
  const { page, limit, skip } = paginate(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE).populate('customer', 'fullName phone').select('-statusHistory').lean(),
    Booking.countDocuments(filter),
  ]);
  res.json({ bookings, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

// PATCH /api/admin/bookings/:id/assign
export async function assignTechnician(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (!['pending', 'assigned'].includes(booking.status)) throw new ApiError(400, 'Only pending or assigned bookings can be (re)assigned.');
  const tech = await User.findOne({ _id: req.body.technicianId, role: 'technician', isActive: true });
  if (!tech) throw new ApiError(400, 'Choose an active technician.');

  const reassigned = booking.technician && String(booking.technician) !== String(tech._id);
  if (reassigned) await Quotation.updateMany({ booking: booking._id, status: 'pending' }, { status: 'superseded' });
  booking.technician = tech._id;
  booking.status = 'assigned';
  booking.statusHistory.push({ status: 'assigned', by: req.user._id, note: `${reassigned ? 'Reassigned' : 'Assigned'} to ${tech.fullName}` });
  await booking.save();
  await booking.populate(BOOKING_POPULATE);
  res.json({ booking });
}

// GET /api/admin/services
export async function listAllServices(_req, res) {
  const services = await Service.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ services });
}

// PATCH /api/admin/services/:id
export async function updateService(req, res) {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found.');
  service.set(req.body);
  await service.save();
  res.json({ service });
}
