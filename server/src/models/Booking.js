import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
export const TIME_SLOTS = ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES },
    note: { type: String, maxlength: 300 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// The address is copied in, so later edits to the saved address don't rewrite history.
const addressSnapshot = new mongoose.Schema(
  { label: String, line1: String, line2: String, landmark: String, city: String, district: String, state: String, pincode: String, contactPhone: String },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNo: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    address: { type: addressSnapshot, required: true },
    addressRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    scheduledDate: { type: Date, required: true },
    timeSlot: { type: String, enum: TIME_SLOTS, required: true },
    issueDescription: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    statusHistory: [historySchema],
    estimatedPrice: { type: Number, min: 0 },
    cancelReason: { type: String, maxlength: 300 },
    completedAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ technician: 1, status: 1, scheduledDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
