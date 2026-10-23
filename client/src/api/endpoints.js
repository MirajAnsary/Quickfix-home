import api from './client';

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  verifyOtp: (body) => api.post('/auth/verify-otp', body),
  resendOtp: (body) => api.post('/auth/resend-otp', body),
  forgotPassword: (body) => api.post('/auth/forgot-password', body),
  resetPassword: (body) => api.post('/auth/reset-password', body),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  updateMe: (body) => api.patch('/users/me', body),
  changePassword: (body) => api.patch('/users/me/password', body),
};

export const serviceApi = {
  list: () => api.get('/services'),
};

export const bookingApi = {
  stats: () => api.get('/bookings/stats'),
  mine: (params) => api.get('/bookings/mine', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (body) => api.post('/bookings', body),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
};

export const quotationApi = {
  create: (body) => api.post('/quotations', body),
  respond: (id, action) => api.patch(`/quotations/${id}/respond`, { action }),
};

export const addressApi = {
  list: () => api.get('/addresses'),
  create: (body) => api.post('/addresses', body),
  update: (id, body) => api.patch(`/addresses/${id}`, body),
  remove: (id) => api.delete(`/addresses/${id}`),
  makeDefault: (id) => api.patch(`/addresses/${id}/default`),
};

export const invoiceApi = {
  mine: (params) => api.get('/invoices/mine', { params }),
  pdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const paymentApi = {
  mine: (params) => api.get('/payments/mine', { params }),
  createOrder: (invoiceId) => api.post('/payments/razorpay/order', { invoiceId }),
  verify: (body) => api.post('/payments/razorpay/verify', body),
  recordCash: (invoiceId) => api.post('/payments/cash', { invoiceId }),
};

export const reviewApi = {
  publicList: () => api.get('/reviews/public'),
  mine: () => api.get('/reviews/mine'),
  create: (body) => api.post('/reviews', body),
};

export const supportApi = {
  mine: () => api.get('/support/tickets/mine'),
  create: (body) => api.post('/support/tickets', body),
};

export const technicianApi = {
  jobs: (params) => api.get('/technician/jobs', { params }),
  updateStatus: (id, body) => api.patch(`/technician/jobs/${id}/status`, body),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  bookings: (params) => api.get('/admin/bookings', { params }),
  assign: (id, technicianId) => api.patch(`/admin/bookings/${id}/assign`, { technicianId }),
  users: (params) => api.get('/admin/users', { params }),
  createTechnician: (body) => api.post('/admin/technicians', body),
  setUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  services: () => api.get('/admin/services'),
  updateService: (id, body) => api.patch(`/admin/services/${id}`, body),
};
