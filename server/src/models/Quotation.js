import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 && v.length <= 15 },
    total: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'superseded'], default: 'pending' },
    respondedAt: Date,
  },
  { timestamps: true }
);

quotationSchema.index({ booking: 1, createdAt: -1 });
quotationSchema.index({ booking: 1, status: 1 });

export const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
