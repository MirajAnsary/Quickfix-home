/**
 * End-to-end smoke test of the real API against a REAL MongoDB.
 *   1. Set MONGODB_URI in .env to a THROWAWAY database (e.g. .../quickfix_test). It is wiped.
 *   2. npm run test:smoke
 * It does not send real OTPs: it plants a known code hash directly in the database,
 * so it tests our verification logic, not your SMS/email provider.
 */
process.env.NODE_ENV = 'test';
process.env.DEV_LOG_OTP = 'true';

const { env } = await import('../src/config/env.js');
if (!/test/i.test(env.mongoUri)) {
  console.error('Refusing to run: MONGODB_URI must contain "test" because this script deletes data.');
  process.exit(1);
}
const mongoose = (await import('mongoose')).default;
const { connectDB } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
const { OTPVerification, User, Service } = await import('../src/models/index.js');
const { hashCodeForTests } = await import('../src/services/otp.service.js');

await connectDB();
await mongoose.connection.db.dropDatabase();
for (const m of Object.values(mongoose.models)) {
  // Real MongoDB supports every index here. Some MongoDB-compatible test servers lack TTL/partial indexes.
  await m.syncIndexes().catch((e) => console.warn(`! ${m.modelName} indexes: ${e.message}`));
}
const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;

let passed = 0;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  server.close();
  mongoose.disconnect();
  process.exit(1);
};
const check = (cond, msg) => (cond ? (passed++, console.log(`✓ ${msg}`)) : fail(msg));

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    return { status: res.status, data: type.includes('json') ? await res.json() : await res.arrayBuffer() };
  };
}
const plantOtp = (email, purpose, code) =>
  OTPVerification.updateOne({ identifier: email, purpose }, { codeHash: hashCodeForTests(email, purpose, code) });

try {
  const cust = client();
  const anon = client();

  await Service.create({ name: 'AC Repair', slug: 'ac-repair', shortDescription: 'x', startingPrice: 299 });
  check((await anon('GET', '/services')).data.services.length === 1, 'public service list');

  // ---- validation ----
  let r = await anon('POST', '/auth/register', { fullName: 'R', phone: '123', email: 'bad', password: 'short' });
  check(r.status === 400 && r.data.details.fields.phone && r.data.details.fields.email, 'register rejects bad input (400 + field errors)');

  // ---- register + OTP ----
  r = await cust('POST', '/auth/register', { fullName: 'Rohit Kumar', phone: '+91 98300 11111', email: 'Rohit@Test.com', password: 'secret123' });
  check(r.status === 201 && r.data.identifier === 'rohit@test.com', 'register creates unverified user and issues OTP');
  const stored = await OTPVerification.findOne({ identifier: 'rohit@test.com' }).select('+codeHash').lean();
  check(stored && /^[a-f0-9]{64}$/.test(stored.codeHash), 'OTP stored only as a hash');

  r = await cust('POST', '/auth/resend-otp', { identifier: 'rohit@test.com', purpose: 'register' });
  check(r.status === 429 && r.data.details.retryAfter > 0, 'resend cooldown enforced');

  r = await cust('POST', '/auth/login', { identifier: '9830011111', password: 'secret123', role: 'customer' });
  check(r.status === 403 && r.data.details.code === 'NOT_VERIFIED', 'unverified user cannot log in');

  await plantOtp('rohit@test.com', 'register', '482913');
  r = await cust('POST', '/auth/verify-otp', { identifier: '9830011111', purpose: 'register', code: '000000' });
  check(r.status === 400 && /attempts left/.test(r.data.message), 'wrong OTP rejected with attempts left');
  r = await cust('POST', '/auth/verify-otp', { identifier: '9830011111', purpose: 'register', code: '482913' });
  check(r.status === 200 && r.data.user.isVerified && !('password' in r.data.user), 'correct OTP verifies + logs in, no password leaked');
  r = await anon('POST', '/auth/verify-otp', { identifier: '9830011111', purpose: 'register', code: '482913' });
  check(r.status === 400, 'OTP cannot be reused');

  // ---- RBAC ----
  check((await anon('GET', '/bookings/mine')).status === 401, 'protected route needs login (401)');
  check((await cust('GET', '/admin/stats')).status === 403, 'customer blocked from admin API (403)');
  check((await cust('GET', '/technician/jobs')).status === 403, 'customer blocked from technician API (403)');
  r = await anon('POST', '/auth/login', { identifier: 'rohit@test.com', password: 'secret123', role: 'admin' });
  check(r.status === 401, 'wrong role tab cannot log in');

  // ---- addresses + booking ----
  r = await cust('POST', '/addresses', { label: 'Home', line1: 'Ward 12, Station Road', city: 'Purulia', pincode: '723101' });
  check(r.status === 201 && r.data.address.isDefault, 'first address becomes default');
  const addressId = r.data.address._id;
  const serviceId = (await anon('GET', '/services')).data.services[0]._id;
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  r = await cust('POST', '/bookings', { serviceId, addressId, scheduledDate: today, timeSlot: '09:00-12:00', issueDescription: 'Not cooling' });
  check(r.status === 201 && /^QF-\d{4}-0001$/.test(r.data.booking.bookingNo), 'booking created with number');
  const bookingId = r.data.booking._id;
  check((await cust('GET', '/bookings/stats')).data.stats.active === 1, 'booking stats');

  // ---- admin + technician ----
  await User.create({ fullName: 'Admin User', email: 'admin@test.com', phone: '9000000000', password: 'adminpass123', role: 'admin', isVerified: true });
  const adm = client();
  check((await adm('POST', '/auth/login', { identifier: 'admin@test.com', password: 'adminpass123', role: 'admin' })).status === 200, 'admin login');
  r = await adm('POST', '/admin/technicians', { fullName: 'Amit Mahato', email: 'amit@test.com', phone: '9000000001', password: 'techpass123', skills: ['ac-repair'] });
  check(r.status === 201, 'admin creates technician');
  const techId = r.data.user._id;
  check((await adm('PATCH', `/admin/bookings/${bookingId}/assign`, { technicianId: techId })).data.booking.status === 'assigned', 'admin assigns technician');

  const tech = client();
  check((await tech('POST', '/auth/login', { identifier: '9000000001', password: 'techpass123', role: 'technician' })).status === 200, 'technician login');
  check((await tech('GET', '/technician/jobs')).data.jobs.length === 1, 'technician sees assigned job');
  check((await tech('PATCH', `/technician/jobs/${bookingId}/status`, { status: 'in_progress' })).status === 200, 'technician starts job');
  r = await tech('PATCH', `/technician/jobs/${bookingId}/status`, { status: 'completed' });
  check(r.status === 400, 'cannot complete without accepted quotation');
  r = await tech('POST', '/quotations', { bookingId, items: [{ description: 'Gas refill', amount: 800 }, { description: 'Labour', amount: 299 }] });
  check(r.status === 201 && r.data.quotation.total === 1099, 'quotation total computed on server');
  check((await cust('PATCH', `/quotations/${r.data.quotation._id}/respond`, { action: 'accept' })).status === 200, 'customer accepts quotation');
  r = await tech('PATCH', `/technician/jobs/${bookingId}/status`, { status: 'completed' });
  check(r.status === 200 && r.data.invoice.total === 1099, 'completion creates invoice');
  const invoiceId = r.data.invoice._id;

  // ---- invoice, payment, review ----
  r = await cust('GET', `/invoices/${invoiceId}/pdf`);
  check(r.status === 200 && Buffer.from(r.data).subarray(0, 4).toString() === '%PDF', 'invoice PDF downloads');
  const other = client();
  await other('POST', '/auth/register', { fullName: 'Other User', phone: '9830022222', email: 'other@test.com', password: 'secret123' });
  await plantOtp('other@test.com', 'register', '111111');
  await other('POST', '/auth/verify-otp', { identifier: 'other@test.com', purpose: 'register', code: '111111' });
  check((await other('GET', `/invoices/${invoiceId}/pdf`)).status === 404, "customer cannot read another customer's invoice");
  check((await other('GET', `/bookings/${bookingId}`)).status === 404, "customer cannot read another customer's booking");

  r = await cust('POST', '/payments/razorpay/order', { invoiceId });
  check(r.status === 503 || r.status === 200 || r.status === 502, `online payment endpoint responds (${r.status}${r.status === 503 ? ': Razorpay not configured' : ''})`);
  check((await tech('POST', '/payments/cash', { invoiceId })).status === 201, 'technician records cash payment');
  check((await cust('GET', '/invoices/mine')).data.invoices[0].status === 'paid', 'invoice marked paid');
  check((await cust('GET', '/bookings/stats')).data.stats.totalSpent === 1099, 'total spent updated');
  check((await cust('POST', '/reviews', { bookingId, rating: 5, comment: 'Great' })).status === 201, 'review created');
  check((await cust('POST', '/reviews', { bookingId, rating: 4 })).status === 409, 'duplicate review blocked');
  check((await anon('GET', '/reviews/public')).data.reviews[0].customerName === 'Rohit K.', 'public review shows only first name + initial');

  // ---- forgot / reset ----
  r = await anon('POST', '/auth/forgot-password', { identifier: 'nobody@test.com' });
  check(r.status === 200, 'forgot-password gives same answer for unknown accounts');
  await anon('POST', '/auth/forgot-password', { identifier: 'rohit@test.com' });
  await plantOtp('rohit@test.com', 'reset', '654321');
  r = await anon('POST', '/auth/verify-otp', { identifier: 'rohit@test.com', purpose: 'reset', code: '654321' });
  check(r.status === 200 && r.data.resetToken, 'reset OTP gives reset token');
  const token = r.data.resetToken;
  check((await anon('POST', '/auth/reset-password', { resetToken: token, password: 'newpass456' })).status === 200, 'password reset');
  check((await anon('POST', '/auth/reset-password', { resetToken: token, password: 'another789' })).status === 400, 'reset token is single-use');
  check((await cust('GET', '/auth/me')).status === 401, 'old session revoked after reset');
  check((await anon('POST', '/auth/login', { identifier: 'rohit@test.com', password: 'newpass456', role: 'customer' })).status === 200, 'login with new password');

  // ---- security headers / injection ----
  r = await fetch(`${base}/health`);
  check(r.headers.get('x-content-type-options') === 'nosniff' && !r.headers.get('x-powered-by'), 'secure headers set');
  r = await anon('POST', '/auth/login', { identifier: { $gt: '' }, password: 'x', role: 'customer' });
  check(r.status === 400, 'NoSQL operator injection rejected');

  console.log(`\nAll ${passed} checks passed.`);
} catch (e) {
  fail(`unexpected error: ${e.stack}`);
}
server.close();
await mongoose.disconnect();
