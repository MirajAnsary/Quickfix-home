import { User } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { setAuthCookie, signAccessToken } from '../utils/tokens.js';

// PATCH /api/users/me — only the name. Phone/email changes need re-verification (not built yet).
export async function updateMe(req, res) {
  req.user.fullName = req.body.fullName;
  await req.user.save();
  res.json({ user: req.user });
}

// PATCH /api/users/me/password
export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect.', { fields: { currentPassword: 'Current password is incorrect.' } });
  }
  if (req.body.currentPassword === req.body.newPassword) {
    throw new ApiError(400, 'New password must be different.', { fields: { newPassword: 'New password must be different.' } });
  }
  user.password = req.body.newPassword;
  await user.save(); // bumps tokenVersion → other devices are logged out
  setAuthCookie(res, signAccessToken(user), true); // keep this device logged in
  res.json({ message: 'Password changed. Other devices have been signed out.' });
}
