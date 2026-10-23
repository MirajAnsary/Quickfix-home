import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler as h } from '../utils/http.js';
import * as s from '../validators/schemas.js';

import authRoutes from './auth.routes.js';
import * as user from '../controllers/user.controller.js';
import * as service from '../controllers/service.controller.js';
import * as address from '../controllers/address.controller.js';
import * as booking from '../controllers/booking.controller.js';
import * as quotation from '../controllers/quotation.controller.js';
import * as technician from '../controllers/technician.controller.js';
import * as payment from '../controllers/payment.controller.js';
import * as invoice from '../controllers/invoice.controller.js';
import * as review from '../controllers/review.controller.js';
import * as support from '../controllers/support.controller.js';
import * as admin from '../controllers/admin.controller.js';

const id = { params: s.idParam };
const customer = [protect, authorize('customer')];
const tech = [protect, authorize('technician')];
const adminOnly = [protect, authorize('admin')];

// ---------- users (any logged-in role) ----------
const users = Router();
users.use(protect);
users.patch('/me', validate({ body: s.updateMeBody }), h(user.updateMe));
users.patch('/me/password', validate({ body: s.changePasswordBody }), h(user.changePassword));

// ---------- services (public) ----------
const services = Router();
services.get('/', h(service.listServices));

// ---------- addresses (customer) ----------
const addresses = Router();
addresses.use(...customer);
addresses.get('/', h(address.listAddresses));
addresses.post('/', validate({ body: s.addressBody }), h(address.createAddress));
addresses.patch('/:id/default', validate(id), h(address.setDefaultAddress));
addresses.patch('/:id', validate({ ...id, body: s.addressUpdateBody }), h(address.updateAddress));
addresses.delete('/:id', validate(id), h(address.deleteAddress));

// ---------- bookings ----------
const bookings = Router();
bookings.post('/', ...customer, validate({ body: s.createBookingBody }), h(booking.createBooking));
bookings.get('/mine', ...customer, validate({ query: s.myBookingsQuery }), h(booking.myBookings));
bookings.get('/stats', ...customer, h(booking.myStats));
bookings.patch('/:id/cancel', ...customer, validate({ ...id, body: s.cancelBookingBody }), h(booking.cancelBooking));
bookings.get('/:id', protect, authorize('customer', 'technician', 'admin'), validate(id), h(booking.getBooking));

// ---------- quotations ----------
const quotations = Router();
quotations.post('/', ...tech, validate({ body: s.createQuotationBody }), h(quotation.createQuotation));
quotations.patch('/:id/respond', ...customer, validate({ ...id, body: s.respondQuotationBody }), h(quotation.respondQuotation));

// ---------- technician ----------
const technicianRoutes = Router();
technicianRoutes.use(...tech);
technicianRoutes.get('/jobs', validate({ query: s.jobsQuery }), h(technician.myJobs));
technicianRoutes.patch('/jobs/:id/status', validate({ ...id, body: s.jobStatusBody }), h(technician.updateJobStatus));

// ---------- payments ----------
const payments = Router();
payments.get('/mine', ...customer, validate({ query: s.paymentsQuery }), h(payment.myPayments));
payments.post('/razorpay/order', ...customer, validate({ body: s.invoiceIdBody }), h(payment.createRazorpayOrder));
payments.post('/razorpay/verify', ...customer, validate({ body: s.razorpayVerifyBody }), h(payment.verifyRazorpayPayment));
payments.post('/cash', protect, authorize('technician', 'admin'), validate({ body: s.invoiceIdBody }), h(payment.recordCashPayment));

// ---------- invoices ----------
const invoices = Router();
invoices.get('/mine', ...customer, validate({ query: s.listQuery }), h(invoice.myInvoices));
invoices.get('/:id/pdf', protect, authorize('customer', 'technician', 'admin'), validate(id), h(invoice.invoicePdf));

// ---------- reviews ----------
const reviews = Router();
reviews.get('/public', h(review.publicReviews));
reviews.get('/mine', ...customer, h(review.myReviews));
reviews.post('/', ...customer, validate({ body: s.createReviewBody }), h(review.createReview));

// ---------- support ----------
const supportRoutes = Router();
supportRoutes.use(...customer);
supportRoutes.get('/tickets/mine', h(support.myTickets));
supportRoutes.post('/tickets', validate({ body: s.createTicketBody }), h(support.createTicket));

// ---------- admin ----------
const adminRoutes = Router();
adminRoutes.use(...adminOnly);
adminRoutes.get('/stats', h(admin.stats));
adminRoutes.get('/users', validate({ query: s.adminUsersQuery }), h(admin.listUsers));
adminRoutes.post('/technicians', validate({ body: s.createTechnicianBody }), h(admin.createTechnician));
adminRoutes.patch('/users/:id/status', validate({ ...id, body: s.userStatusBody }), h(admin.setUserStatus));
adminRoutes.get('/bookings', validate({ query: s.adminBookingsQuery }), h(admin.listBookings));
adminRoutes.patch('/bookings/:id/assign', validate({ ...id, body: s.assignBody }), h(admin.assignTechnician));
adminRoutes.get('/services', h(admin.listAllServices));
adminRoutes.patch('/services/:id', validate({ ...id, body: s.updateServiceBody }), h(admin.updateService));

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', users);
router.use('/services', services);
router.use('/addresses', addresses);
router.use('/bookings', bookings);
router.use('/quotations', quotations);
router.use('/technician', technicianRoutes);
router.use('/payments', payments);
router.use('/invoices', invoices);
router.use('/reviews', reviews);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);

export default router;
