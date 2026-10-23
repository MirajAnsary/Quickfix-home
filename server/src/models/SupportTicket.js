import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

ticketSchema.index({ user: 1, createdAt: -1 });

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', ticketSchema);
