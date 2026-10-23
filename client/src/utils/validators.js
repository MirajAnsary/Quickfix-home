// Frontend checks give quick feedback. The backend repeats every check — never trust the browser alone.
export const normalizePhone = (v = '') => {
  let d = String(v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};

export const rules = {
  required: (label) => (v) => (String(v ?? '').trim() ? '' : `${label} is required`),
  fullName: (v) => (/^[A-Za-z][A-Za-z .'-]{1,79}$/.test(String(v).trim()) ? '' : 'Enter your full name (letters only)'),
  phone: (v) => (/^[6-9]\d{9}$/.test(normalizePhone(v)) ? '' : 'Enter a valid 10-digit mobile number'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Enter a valid email address'),
  password: (v) => {
    if (!v || v.length < 8) return 'Use at least 8 characters';
    if (v.length > 72) return 'Use 72 characters or fewer';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number';
    return '';
  },
  identifier: (v) => {
    const s = String(v).trim();
    if (!s) return 'Enter your phone number or email';
    return s.includes('@') ? rules.email(s) : rules.phone(s) ? 'Enter a valid phone number or email' : '';
  },
  pincode: (v) => (/^\d{6}$/.test(String(v).trim()) ? '' : 'Enter a 6-digit PIN code'),
  optionalPhone: (v) => (!String(v ?? '').trim() ? '' : rules.phone(v)),
};

export function validateFields(values, schema) {
  const errors = {};
  for (const [key, check] of Object.entries(schema)) {
    const msg = check(values[key] ?? '', values);
    if (msg) errors[key] = msg;
  }
  return errors;
}
