import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/** Atomic, human-friendly numbers: QF-2026-0001, INV-2026-0001, TKT-2026-0001. */
export async function nextNumber(prefix) {
  const year = new Date().getFullYear();
  const c = await Counter.findOneAndUpdate({ _id: `${prefix}-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `${prefix}-${year}-${String(c.seq).padStart(4, '0')}`;
}
