import DashboardShell from './DashboardShell';

const CUSTOMER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
  { to: '/my-bookings', label: 'My Bookings', icon: 'bi-calendar-check' },
  { to: '/my-addresses', label: 'Addresses', icon: 'bi-geo-alt' },
  { to: '/my-invoices', label: 'Invoices', icon: 'bi-receipt' },
  { to: '/payment-history', label: 'Payment History', icon: 'bi-credit-card' },
  { to: '/my-reviews', label: 'Reviews', icon: 'bi-star' },
  { to: '/support', label: 'Support', icon: 'bi-headset' },
  { to: '/profile', label: 'Profile', icon: 'bi-person' },
];

const TECHNICIAN_NAV = [
  { to: '/technician', label: 'My Jobs', icon: 'bi-tools', end: true },
  { to: '/technician/profile', label: 'Profile', icon: 'bi-person' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview & Bookings', icon: 'bi-speedometer2', end: true },
  { to: '/admin/technicians', label: 'Technicians', icon: 'bi-person-gear' },
  { to: '/admin/customers', label: 'Customers', icon: 'bi-people' },
  { to: '/admin/services', label: 'Services & Prices', icon: 'bi-tags' },
  { to: '/admin/profile', label: 'Profile', icon: 'bi-person' },
];

export const CustomerLayout = () => <DashboardShell nav={CUSTOMER_NAV} roleLabel="Customer" showBookButton />;
export const TechnicianLayout = () => <DashboardShell nav={TECHNICIAN_NAV} roleLabel="Technician" />;
export const AdminLayout = () => <DashboardShell nav={ADMIN_NAV} roleLabel="Admin" />;
