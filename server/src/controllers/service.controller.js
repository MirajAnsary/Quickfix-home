import { Service } from '../models/index.js';

// GET /api/services (public)
export async function listServices(_req, res) {
  const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).select('-__v').lean();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ services });
}
