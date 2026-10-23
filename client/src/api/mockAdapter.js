// ============================================================================
// DEMO MODE ADAPTER — used only when VITE_USE_MOCK=true.
// Answers API calls in the browser with sample data so you can click through
// every page without a backend. Changes live in memory and vanish on reload.
// The demo OTP is 123456. It is NOT a real OTP and proves nothing about delivery.
// ============================================================================
import { MOCK } from '../data/mockData';

export const DEMO_OTP = '123456';
const db = JSON.parse(JSON.stringify(MOCK));
let user = null;
try {
  user = JSON.parse(sessionStorage.getItem('qf_demo_user') || 'null');
} catch {
  user = null;
}
const setUser = (u) => {
  user = u;
  try {
    if (u) sessionStorage.setItem('qf_demo_user', JSON.stringify(u));
    else sessionStorage.removeItem('qf_demo_user');
  } catch {
    /* storage blocked — keep in memory only */
  }
};

const id = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const page = (items, params = {}) => {
  const limit = Number(params.limit) || 10;
  const p = Number(params.page) || 1;
  return { items: items.slice((p - 1) * limit, p * limit), total: items.length, page: p, pages: Math.max(1, Math.ceil(items.length / limit)) };
};
const E = (status, message, details) => ({ __error: true, status, message, details });

const routes = [
  // ---------- auth ----------
  ['get', /^\/auth\/me$/, () => (user ? { user } : E(401, 'Please log in'))],
  ['post', /^\/auth\/login$/, ({ body }) => {
    const u = db.users[body.role] || db.users.customer;
    setUser(u);
    return { user: u };
  }],
  ['post', /^\/auth\/register$/, ({ body }) => ({ message: 'Demo: account created.', identifier: body.email, sentTo: ['demo inbox'], resendAfter: 30 })],
  ['post', /^\/auth\/verify-otp$/, ({ body }) => {
    if (body.code !== DEMO_OTP) return E(400, 'Incorrect code. (Demo code is 123456)');
    if (body.purpose === 'reset') return { resetToken: 'demo-reset-token' };
    setUser(db.users.customer);
    return { user: db.users.customer };
  }],
  ['post', /^\/auth\/resend-otp$/, () => ({ message: 'Demo: new code "sent".', resendAfter: 30 })],
  ['post', /^\/auth\/forgot-password$/, ({ body }) => ({ message: 'Demo: if the account exists, a code was sent.', identifier: body.identifier, resendAfter: 30 })],
  ['post', /^\/auth\/reset-password$/, () => ({ message: 'Demo: password updated.' })],
  ['post', /^\/auth\/logout$/, () => { setUser(null); return { message: 'Logged out' }; }],

  // ---------- user ----------
  ['patch', /^\/users\/me$/, ({ body }) => { setUser({ ...user, fullName: body.fullName }); return { user }; }, true],
  ['patch', /^\/users\/me\/password$/, () => ({ message: 'Demo: password changed.' }), true],

  // ---------- public ----------
  ['get', /^\/services$/, () => ({ services: db.services })],
  ['get', /^\/reviews\/public$/, () => ({ reviews: db.publicReviews })],

  // ---------- bookings ----------
  ['get', /^\/bookings\/stats$/, () => {
    const b = db.bookings;
    const paid = db.payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    return { stats: { total: b.length, completed: b.filter((x) => x.status === 'completed').length, active: b.filter((x) => ['pending', 'assigned', 'in_progress'].includes(x.status)).length, cancelled: b.filter((x) => x.status === 'cancelled').length, totalSpent: paid } };
  }, true],
  ['get', /^\/bookings\/mine$/, ({ params }) => {
    let list = db.bookings;
    if (params.status === 'active') list = list.filter((x) => ['pending', 'assigned', 'in_progress'].includes(x.status));
    else if (params.status) list = list.filter((x) => x.status === params.status);
    const r = page(list, params);
    return { bookings: r.items, total: r.total, page: r.page, pages: r.pages };
  }, true],
  ['get', /^\/bookings\/([\w-]+)$/, ({ m }) => {
    const booking = db.bookings.find((b) => b._id === m[1]);
    if (!booking) return E(404, 'Booking not found');
    return { booking, quotations: db.quotations.filter((q) => q.booking === booking._id), invoice: db.invoices.find((i) => i.booking?._id === booking._id) || null, review: null };
  }, true],
  ['post', /^\/bookings$/, ({ body }) => {
    const service = db.services.find((s) => s._id === body.serviceId);
    const address = db.addresses.find((a) => a._id === body.addressId);
    if (!service || !address) return E(400, 'Choose a service and address');
    const booking = { _id: id(), bookingNo: `QF-2026-${String(13 + db.bookings.length).padStart(4, '0')}`, service, technician: null, status: 'pending', scheduledDate: body.scheduledDate, timeSlot: body.timeSlot, issueDescription: body.issueDescription, estimatedPrice: service.startingPrice, address, createdAt: now(), statusHistory: [{ status: 'pending', at: now() }] };
    db.bookings.unshift(booking);
    return { booking };
  }, true],
  ['patch', /^\/bookings\/([\w-]+)\/cancel$/, ({ m, body }) => {
    const b = db.bookings.find((x) => x._id === m[1]);
    if (!b || !['pending', 'assigned'].includes(b.status)) return E(400, 'This booking can no longer be cancelled');
    b.status = 'cancelled';
    b.cancelReason = body.reason;
    b.statusHistory.push({ status: 'cancelled', at: now() });
    return { booking: b };
  }, true],
  ['patch', /^\/quotations\/([\w-]+)\/respond$/, ({ m, body }) => {
    const q = db.quotations.find((x) => x._id === m[1]);
    if (!q || q.status !== 'pending') return E(400, 'This quotation is no longer open');
    q.status = body.action === 'accept' ? 'accepted' : 'rejected';
    return { quotation: q };
  }, true],
  ['post', /^\/quotations$/, ({ body }) => {
    const total = body.items.reduce((s, i) => s + Number(i.amount), 0);
    const q = { _id: id(), booking: body.bookingId, items: body.items, total, status: 'pending', createdAt: now() };
    db.quotations.push(q);
    return { quotation: q };
  }, true],

  // ---------- addresses ----------
  ['get', /^\/addresses$/, () => ({ addresses: db.addresses })],
  ['post', /^\/addresses$/, ({ body }) => {
    const a = { _id: id(), ...body, isDefault: db.addresses.length === 0 };
    db.addresses.push(a);
    return { address: a };
  }, true],
  ['patch', /^\/addresses\/([\w-]+)\/default$/, ({ m }) => {
    db.addresses.forEach((a) => { a.isDefault = a._id === m[1]; });
    return { address: db.addresses.find((a) => a._id === m[1]) };
  }, true],
  ['patch', /^\/addresses\/([\w-]+)$/, ({ m, body }) => {
    const a = db.addresses.find((x) => x._id === m[1]);
    if (!a) return E(404, 'Address not found');
    Object.assign(a, body);
    return { address: a };
  }, true],
  ['delete', /^\/addresses\/([\w-]+)$/, ({ m }) => {
    const wasDefault = db.addresses.find((a) => a._id === m[1])?.isDefault;
    db.addresses = db.addresses.filter((a) => a._id !== m[1]);
    if (wasDefault && db.addresses[0]) db.addresses[0].isDefault = true;
    return { message: 'Address deleted' };
  }, true],

  // ---------- invoices & payments ----------
  ['get', /^\/invoices\/mine$/, ({ params }) => { const r = page(db.invoices, params); return { invoices: r.items, total: r.total, page: r.page, pages: r.pages }; }, true],
  ['get', /^\/invoices\/([\w-]+)\/pdf$/, () => E(501, 'Demo mode: PDF download needs the live backend.'), true],
  ['get', /^\/payments\/mine$/, ({ params }) => {
    let list = db.payments;
    if (params.method) list = list.filter((p) => p.method === params.method);
    const r = page(list, params);
    return { payments: r.items, total: r.total, page: r.page, pages: r.pages };
  }, true],
  ['post', /^\/payments\/razorpay\/order$/, () => E(503, 'Demo mode: online payment needs the live backend with Razorpay keys.'), true],
  ['post', /^\/payments\/cash$/, ({ body }) => {
    const inv = db.invoices.find((i) => i._id === body.invoiceId);
    if (inv) inv.status = 'paid';
    return { message: 'Demo: cash payment recorded' };
  }, true],

  // ---------- reviews & support ----------
  ['get', /^\/reviews\/mine$/, () => {
    const count = db.myReviews.length;
    const average = count ? db.myReviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { reviews: db.myReviews, count, average };
  }, true],
  ['post', /^\/reviews$/, ({ body }) => {
    const b = db.bookings.find((x) => x._id === body.bookingId);
    if (!b) return E(400, 'Booking not found');
    b.hasReview = true;
    const r = { _id: id(), booking: { _id: b._id, bookingNo: b.bookingNo }, service: b.service, rating: body.rating, comment: body.comment, createdAt: now() };
    db.myReviews.unshift(r);
    return { review: r };
  }, true],
  ['get', /^\/support\/tickets\/mine$/, () => ({ tickets: db.tickets }), true],
  ['post', /^\/support\/tickets$/, ({ body }) => {
    const t = { _id: id(), ticketNo: `TKT-2026-${String(db.tickets.length + 1).padStart(4, '0')}`, ...body, status: 'open', createdAt: now() };
    db.tickets.unshift(t);
    return { ticket: t };
  }, true],

  // ---------- technician ----------
  ['get', /^\/technician\/jobs$/, ({ params }) => {
    let jobs = db.bookings.filter((b) => b.technician).map((b) => ({ ...b, customer: { fullName: 'Rohit Kumar', phone: '8250912345' }, latestQuotation: db.quotations.filter((q) => q.booking === b._id).slice(-1)[0] || null, invoice: db.invoices.find((i) => i.booking?._id === b._id) || null }));
    if (params.status) jobs = jobs.filter((j) => j.status === params.status);
    return { jobs };
  }, true],
  ['patch', /^\/technician\/jobs\/([\w-]+)\/status$/, ({ m, body }) => {
    const b = db.bookings.find((x) => x._id === m[1]);
    if (!b) return E(404, 'Job not found');
    b.status = body.status;
    b.statusHistory.push({ status: body.status, at: now() });
    return { booking: b };
  }, true],

  // ---------- admin ----------
  ['get', /^\/admin\/stats$/, () => ({ stats: { customers: db.customers.length, technicians: db.technicians.length, bookings: { total: db.bookings.length, pending: db.bookings.filter((b) => b.status === 'pending').length, active: db.bookings.filter((b) => ['assigned', 'in_progress'].includes(b.status)).length, completed: db.bookings.filter((b) => b.status === 'completed').length }, revenue: db.payments.reduce((s, p) => s + p.amount, 0) } }), true],
  ['get', /^\/admin\/bookings$/, ({ params }) => {
    let list = db.bookings.map((b) => ({ ...b, customer: { fullName: 'Rohit Kumar', phone: '8250912345' } }));
    if (params.status) list = list.filter((b) => b.status === params.status);
    const r = page(list, params);
    return { bookings: r.items, total: r.total, page: r.page, pages: r.pages };
  }, true],
  ['patch', /^\/admin\/bookings\/([\w-]+)\/assign$/, ({ m, body }) => {
    const b = db.bookings.find((x) => x._id === m[1]);
    const t = db.technicians.find((x) => x._id === body.technicianId);
    if (!b || !t) return E(400, 'Booking or technician not found');
    b.technician = { _id: t._id, fullName: t.fullName, phone: t.phone };
    b.status = 'assigned';
    return { booking: b };
  }, true],
  ['get', /^\/admin\/users$/, ({ params }) => {
    const list = params.role === 'technician' ? db.technicians : db.customers;
    const r = page(list, params);
    return { users: r.items, total: r.total, page: r.page, pages: r.pages };
  }, true],
  ['post', /^\/admin\/technicians$/, ({ body }) => {
    const t = { _id: id(), ...body, password: undefined, role: 'technician', isActive: true, isVerified: true, createdAt: now() };
    db.technicians.push(t);
    return { user: t };
  }, true],
  ['patch', /^\/admin\/users\/([\w-]+)\/status$/, ({ m, body }) => {
    const u = [...db.customers, ...db.technicians].find((x) => x._id === m[1]);
    if (u) u.isActive = body.isActive;
    return { user: u };
  }, true],
  ['get', /^\/admin\/services$/, () => ({ services: db.services }), true],
  ['patch', /^\/admin\/services\/([\w-]+)$/, ({ m, body }) => {
    const s = db.services.find((x) => x._id === m[1]);
    Object.assign(s, body);
    return { service: s };
  }, true],
];

export async function mockAdapter(config) {
  await new Promise((r) => setTimeout(r, 250));
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  let body = {};
  try {
    body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data || {};
  } catch {
    body = {};
  }
  const respond = (status, data) => {
    const res = { data, status, statusText: String(status), headers: {}, config, request: {} };
    if (status >= 400) {
      const err = new Error(data.message);
      err.response = res;
      err.config = config;
      throw err;
    }
    return res;
  };

  for (const [m, re, handler, needsAuth] of routes) {
    if (m !== method) continue;
    const match = url.match(re);
    if (!match) continue;
    if (needsAuth && !user) return respond(401, { message: 'Please log in' });
    const out = handler({ body, params: config.params || {}, m: match });
    if (out?.__error) return respond(out.status, { message: out.message, details: out.details });
    return respond(200, out);
  }
  return respond(404, { message: `Demo mode: no sample data for ${method.toUpperCase()} ${url}` });
}
