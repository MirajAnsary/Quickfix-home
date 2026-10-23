import mongoose from 'mongoose';

// One record per (identifier, purpose). Only an HMAC of the code is stored — never the code.
const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, lowercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purpose: { type: String, enum: ['register', 'reset'], required: true },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    resendAvailableAt: Date,
    sendCount: { type: Number, default: 0 },
    windowStartedAt: Date,
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ identifier: 1, purpose: 1 }, { unique: true });
otpSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB auto-deletes old records

export const OTPVerification = mongoose.models.OTPVerification || mongoose.model('OTPVerification', otpSchema);
