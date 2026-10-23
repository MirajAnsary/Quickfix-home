export const normalizePhone = (v = '') => {
  let d = String(v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};

export const isEmail = (v = '') => String(v).includes('@');

/** Mongo filter for "phone or email" login fields. */
export const identifierQuery = (identifier) =>
  isEmail(identifier) ? { email: String(identifier).trim().toLowerCase() } : { phone: normalizePhone(identifier) };

export const maskEmail = (email = '') => {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
};

export const maskPhone = (phone = '') => `+91 ${phone.slice(0, 2)}******${phone.slice(-2)}`;

export const round2 = (n) => Math.round(n * 100) / 100;

/** Midnight today in India time, as a Date. */
export const startOfTodayIST = () => {
  const istDate = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(`${istDate}T00:00:00+05:30`);
};

export const paginate = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};
