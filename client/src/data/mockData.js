// ============================================================================
// MOCK DATA — DEMO MODE ONLY (VITE_USE_MOCK=true).
// These are made-up sample records copied from the design sheet. They are never
// sent to or read from the real backend. Do not treat them as real customers.
// ============================================================================

const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const MOCK = {
  users: {
    customer: { _id: 'u-cust-1', fullName: 'Rohit Kumar', email: 'rohit@gmail.com', phone: '8250912345', role: 'customer', isVerified: true, isActive: true, createdAt: d(200) },
    technician: { _id: 'u-tech-1', fullName: 'Amit Mahato', email: 'amit.tech@quickfixhome.in', phone: '9000000001', role: 'technician', isVerified: true, isActive: true, skills: ['ac-repair', 'fridge-repair'], createdAt: d(300) },
    admin: { _id: 'u-admin-1', fullName: 'Admin User', email: 'admin@quickfixhome.in', phone: '9000000000', role: 'admin', isVerified: true, isActive: true, createdAt: d(400) },
  },
  services: [
    { _id: 's1', name: 'AC Repair', slug: 'ac-repair', shortDescription: 'Cooling Problem, Gas Charging', issues: ['Not cooling', 'Gas charging', 'Water leakage', 'Noise', 'PCB fault'], startingPrice: 299, isActive: true },
    { _id: 's2', name: 'Fridge Repair', slug: 'fridge-repair', shortDescription: 'Cooling, Leakage, Compressor', issues: ['Not cooling', 'Water leakage', 'Compressor issue', 'Thermostat'], startingPrice: 249, isActive: true },
    { _id: 's3', name: 'Geyser Repair', slug: 'geyser-repair', shortDescription: 'Heating, Thermostat, Water Leakage', issues: ['No hot water', 'Thermostat', 'Leakage', 'Tripping'], startingPrice: 199, isActive: true },
    { _id: 's4', name: 'Washing Machine', slug: 'washing-machine-repair', shortDescription: 'Drainage, Spinning, Motor Issue', issues: ['Not draining', 'Not spinning', 'Motor issue', 'Door lock'], startingPrice: 249, isActive: true },
    { _id: 's5', name: 'Mixer Grinder', slug: 'mixer-grinder-repair', shortDescription: 'Motor, Jar, Blade Replacement', issues: ['Motor not running', 'Jar leakage', 'Blade replacement'], startingPrice: 149, isActive: true },
    { _id: 's6', name: 'Microwave Oven', slug: 'microwave-oven-repair', shortDescription: 'Heating, Control Panel Issue', issues: ['Not heating', 'Control panel', 'Sparking', 'Turntable'], startingPrice: 199, isActive: true },
  ],
  addresses: [
    { _id: 'a1', label: 'Home', line1: 'Ward 12, Station Road', city: 'Purulia', district: 'Purulia', state: 'West Bengal', pincode: '723101', isDefault: true },
    { _id: 'a2', label: 'Office', line1: 'Main Market', city: 'Raghunathpur', district: 'Purulia', state: 'West Bengal', pincode: '723133', isDefault: false },
  ],
  bookings: [
    { _id: 'b1', bookingNo: 'QF-2026-0012', service: { _id: 's1', name: 'AC Repair', slug: 'ac-repair' }, technician: { fullName: 'Amit Mahato', phone: '9000000001' }, status: 'completed', scheduledDate: d(30), timeSlot: '09:00-12:00', issueDescription: 'AC not cooling', estimatedPrice: 299, address: { label: 'Home', line1: 'Ward 12, Station Road', city: 'Purulia', pincode: '723101' }, createdAt: d(31), hasReview: true, statusHistory: [{ status: 'pending', at: d(31) }, { status: 'assigned', at: d(31) }, { status: 'in_progress', at: d(30) }, { status: 'completed', at: d(30) }] },
    { _id: 'b2', bookingNo: 'QF-2026-0011', service: { _id: 's2', name: 'Fridge Repair', slug: 'fridge-repair' }, technician: { fullName: 'Amit Mahato', phone: '9000000001' }, status: 'in_progress', scheduledDate: d(1), timeSlot: '12:00-15:00', issueDescription: 'Water leaking from freezer', estimatedPrice: 249, address: { label: 'Home', line1: 'Ward 12, Station Road', city: 'Purulia', pincode: '723101' }, createdAt: d(2), hasReview: false, statusHistory: [{ status: 'pending', at: d(2) }, { status: 'assigned', at: d(2) }, { status: 'in_progress', at: d(1) }] },
    { _id: 'b3', bookingNo: 'QF-2026-0010', service: { _id: 's4', name: 'Washing Machine', slug: 'washing-machine-repair' }, technician: { fullName: 'Amit Mahato', phone: '9000000001' }, status: 'completed', scheduledDate: d(45), timeSlot: '15:00-18:00', issueDescription: 'Drum not spinning', estimatedPrice: 249, address: { label: 'Office', line1: 'Main Market', city: 'Raghunathpur', pincode: '723133' }, createdAt: d(46), hasReview: false, statusHistory: [{ status: 'pending', at: d(46) }, { status: 'completed', at: d(45) }] },
    { _id: 'b4', bookingNo: 'QF-2026-0009', service: { _id: 's3', name: 'Geyser Repair', slug: 'geyser-repair' }, technician: null, status: 'pending', scheduledDate: d(-2), timeSlot: '09:00-12:00', issueDescription: 'No hot water', estimatedPrice: 199, address: { label: 'Home', line1: 'Ward 12, Station Road', city: 'Purulia', pincode: '723101' }, createdAt: d(0), hasReview: false, statusHistory: [{ status: 'pending', at: d(0) }] },
  ],
  quotations: [
    { _id: 'q1', booking: 'b2', items: [{ description: 'Freezer drain pipe replacement', amount: 450 }, { description: 'Labour', amount: 249 }], total: 699, status: 'pending', createdAt: d(1) },
  ],
  invoices: [
    { _id: 'i1', invoiceNo: 'INV-2026-0045', booking: { _id: 'b1', bookingNo: 'QF-2026-0012', service: { name: 'AC Repair' } }, total: 1099, subtotal: 1099, taxAmount: 0, status: 'paid', createdAt: d(30), paidAt: d(30) },
    { _id: 'i2', invoiceNo: 'INV-2026-0043', booking: { _id: 'b3', bookingNo: 'QF-2026-0010', service: { name: 'Washing Machine' } }, total: 850, subtotal: 850, taxAmount: 0, status: 'paid', createdAt: d(45), paidAt: d(45) },
    { _id: 'i3', invoiceNo: 'INV-2026-0041', booking: { _id: 'b0', bookingNo: 'QF-2026-0004', service: { name: 'Microwave Oven' } }, total: 1450, subtotal: 1450, taxAmount: 0, status: 'unpaid', createdAt: d(60) },
  ],
  payments: [
    { _id: 'p1', invoice: { invoiceNo: 'INV-2026-0045' }, amount: 1099, method: 'razorpay', status: 'paid', paidAt: d(30), createdAt: d(30) },
    { _id: 'p2', invoice: { invoiceNo: 'INV-2026-0043' }, amount: 850, method: 'cash', status: 'paid', paidAt: d(45), createdAt: d(45) },
  ],
  myReviews: [
    { _id: 'r1', booking: { _id: 'b1', bookingNo: 'QF-2026-0012' }, service: { name: 'AC Repair' }, rating: 5, comment: 'Very professional service! AC is working perfectly now.', createdAt: d(29) },
  ],
  publicReviews: [
    { _id: 'pr1', customerName: 'Rohit Kumar', city: 'Purulia', rating: 5, comment: 'Very professional service! AC is working perfectly now.' },
    { _id: 'pr2', customerName: 'Puja Das', city: 'Purulia', rating: 5, comment: 'QuickFix Home is really reliable. Highly recommended!' },
    { _id: 'pr3', customerName: 'Suman Mahato', city: 'Purulia', rating: 5, comment: 'On-time service and reasonable price.' },
  ],
  tickets: [],
  customers: [
    { _id: 'u-cust-1', fullName: 'Rohit Kumar', email: 'rohit@gmail.com', phone: '8250912345', role: 'customer', isActive: true, isVerified: true, createdAt: d(200) },
    { _id: 'u-cust-2', fullName: 'Puja Das', email: 'puja@gmail.com', phone: '9123456780', role: 'customer', isActive: true, isVerified: true, createdAt: d(120) },
  ],
  technicians: [
    { _id: 'u-tech-1', fullName: 'Amit Mahato', email: 'amit.tech@quickfixhome.in', phone: '9000000001', role: 'technician', isActive: true, isVerified: true, skills: ['ac-repair', 'fridge-repair'], createdAt: d(300) },
  ],
};
