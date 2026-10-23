import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    items: [{ _id: false, description: String, amount: Number }],
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paidAt: Date,
  },
  { timestamps: true }
);

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
