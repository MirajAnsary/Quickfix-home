import { Address } from '../models/index.js';
import { ApiError } from '../utils/http.js';

const MAX_ADDRESSES = 10;

const findOwn = async (req) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found.');
  return address;
};

export async function listAddresses(req, res) {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
  res.json({ addresses });
}

export async function createAddress(req, res) {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= MAX_ADDRESSES) throw new ApiError(400, `You can save up to ${MAX_ADDRESSES} addresses.`);
  const address = await Address.create({ ...req.body, user: req.user._id, isDefault: count === 0 });
  res.status(201).json({ address });
}

export async function updateAddress(req, res) {
  const address = await findOwn(req);
  address.set(req.body);
  await address.save();
  res.json({ address });
}

export async function deleteAddress(req, res) {
  const address = await findOwn(req);
  await address.deleteOne();
  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (next) await Address.updateOne({ _id: next._id }, { isDefault: true });
  }
  res.json({ message: 'Address deleted.' });
}

export async function setDefaultAddress(req, res) {
  const address = await findOwn(req);
  await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
  address.isDefault = true;
  await address.save();
  res.json({ address });
}
