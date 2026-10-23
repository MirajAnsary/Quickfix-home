import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120, default: '' },
    landmark: { type: String, trim: true, maxlength: 80, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    district: { type: String, trim: true, maxlength: 60, default: '' },
    state: { type: String, trim: true, maxlength: 60, default: 'West Bengal' },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    contactPhone: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

export const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
