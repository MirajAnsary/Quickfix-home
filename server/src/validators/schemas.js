import { z } from 'zod';
import { normalizePhone } from '../utils/format.js';
import { TIME_SLOTS, BOOKING_STATUSES } from '../models/index.js';

// ---------- shared pieces ----------
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = z.object({ id: objectId });

const phone = z
  .string({ required_error: 'Phone number is required' })
  .transform(normalizePhone)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'));
const email = z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address').max(120);
const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');
const fullName = z.string().trim().min(2, 'Enter your full name').max(80).regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Use letters only');
const identifier = z.string({ required_error: 'Enter your phone number or email' }).trim().min(3, 'Enter your phone number or email').max(120);
const purpose = z.enum(['register', 'reset']);
const pageQuery = {
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
};

// ---------- auth ----------
export const registerBody = z.object({ fullName, phone, email, password }).strict();
export const loginBody = z
  .object({ identifier, password: z.string().min(1, 'Password is required').max(72), role: z.enum(['customer', 'technician', 'admin']), rememberMe: z.boolean().optional() })
  .strict();
export const verifyOtpBody = z.object({ identifier, purpose, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') }).strict();
export const resendOtpBody = z.object({ identifier, purpose }).strict();
export const forgotBody = z.object({ identifier }).strict();
export const resetBody = z.object({ resetToken: z.string().min(20).max(2000), password }).strict();

// ---------- user ----------
export const updateMeBody = z.object({ fullName }).strict();
export const changePasswordBody = z.object({ currentPassword: z.string().min(1, 'Current password is required').max(72), newPassword: password }).strict();

// ---------- address ----------
const addressFields = {
  label: z.enum(['Home', 'Office', 'Other']).default('Home'),
  line1: z.string().trim().min(3, 'Enter village / locality (at least 3 letters)').max(120),
  line2: z.string().trim().max(120).optional().default(''),
  landmark: z.string().trim().max(80).optional().default(''),
  city: z.string().trim().min(2, 'Enter city').max(60),
  district: z.string().trim().max(60).optional().default(''),
  state: z.string().trim().max(60).optional().default('West Bengal'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'),
  contactPhone: z.union([z.literal(''), phone]).optional().default(''),
};
export const addressBody = z.object(addressFields).strict();
export const addressUpdateBody = z
  .object(Object.fromEntries(Object.entries(addressFields).map(([k, v]) => [k, v.optional()])))
  .strict();

// ---------- bookings ----------
export const createBookingBody = z
  .object({
    serviceId: objectId,
    addressId: objectId,
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
    timeSlot: z.enum(TIME_SLOTS),
    issueDescription: z.string().trim().max(500).optional().default(''),
  })
  .strict();
export const cancelBookingBody = z.object({ reason: z.string().trim().max(300).optional().default('') }).strict();
export const myBookingsQuery = z.object({ status: z.enum([...BOOKING_STATUSES, 'active']).optional(), ...pageQuery });

// ---------- quotations ----------
export const createQuotationBody = z
  .object({
    bookingId: objectId,
    items: z
      .array(z.object({ description: z.string().trim().min(2, 'Each line needs a description of at least 2 letters (e.g. "Labour").').max(120), amount: z.number().min(0).max(200000) }).strict())
      .min(1, 'Add at least one line')
      .max(15),
    note: z.string().trim().max(300).optional().default(''),
  })
  .strict();
export const respondQuotationBody = z.object({ action: z.enum(['accept', 'reject']) }).strict();

// ---------- technician ----------
export const jobsQuery = z.object({ status: z.enum(BOOKING_STATUSES).optional() });
export const jobStatusBody = z.object({ status: z.enum(['in_progress', 'completed']), note: z.string().trim().max(300).optional() }).strict();

// ---------- payments / invoices ----------
export const listQuery = z.object({ ...pageQuery });
export const paymentsQuery = z.object({ method: z.enum(['razorpay', 'cash']).optional(), ...pageQuery });
export const invoiceIdBody = z.object({ invoiceId: objectId }).strict();
export const razorpayVerifyBody = z
  .object({
    razorpay_order_id: z.string().min(5).max(100),
    razorpay_payment_id: z.string().min(5).max(100),
    razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i),
  })
  .strict();

// ---------- reviews & support ----------
export const createReviewBody = z
  .object({ bookingId: objectId, rating: z.number().int().min(1).max(5), comment: z.string().trim().max(500).optional().default('') })
  .strict();
export const createTicketBody = z
  .object({
    subject: z.string().trim().min(3, 'Subject is too short').max(120),
    message: z.string().trim().min(10, 'Please describe the issue').max(1000),
    bookingId: objectId.optional(),
  })
  .strict();

// ---------- admin ----------
export const adminUsersQuery = z.object({ role: z.enum(['customer', 'technician', 'admin']).optional(), ...pageQuery });
export const adminBookingsQuery = z.object({ status: z.enum(BOOKING_STATUSES).optional(), ...pageQuery });
export const createTechnicianBody = z
  .object({ fullName, phone, email, password, skills: z.array(z.string().trim().max(60)).max(20).optional().default([]) })
  .strict();
export const userStatusBody = z.object({ isActive: z.boolean() }).strict();
export const assignBody = z.object({ technicianId: objectId }).strict();
export const updateServiceBody = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    shortDescription: z.string().trim().max(120).optional(),
    issues: z.array(z.string().trim().max(60)).max(20).optional(),
    startingPrice: z.number().min(0).max(100000).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();
