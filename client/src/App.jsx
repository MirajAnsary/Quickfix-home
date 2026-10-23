import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import { AdminLayout, CustomerLayout, TechnicianLayout } from './layouts/RoleLayouts';
import { GuestOnly, ProtectedRoute } from './routes/guards';

import Home from './pages/public/Home';
import Legal from './pages/public/Legal';
import NotFound from './pages/public/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import Dashboard from './pages/customer/Dashboard';
import Profile from './pages/customer/Profile';
import MyBookings from './pages/customer/MyBookings';
import BookService from './pages/customer/BookService';
import MyAddresses from './pages/customer/MyAddresses';
import MyInvoices from './pages/customer/MyInvoices';
import PaymentHistory from './pages/customer/PaymentHistory';
import MyReviews from './pages/customer/MyReviews';
import Support from './pages/customer/Support';

import TechnicianJobs from './pages/technician/TechnicianJobs';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTechnicians from './pages/admin/AdminTechnicians';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminServices from './pages/admin/AdminServices';

export default function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Legal type="terms" />} />
        <Route path="/privacy" element={<Legal type="privacy" />} />
      </Route>

      {/* Auth pages (only when logged out) */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Customer area */}
      <Route element={<ProtectedRoute roles={['customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/book" element={<BookService />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-addresses" element={<MyAddresses />} />
          <Route path="/my-invoices" element={<MyInvoices />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/support" element={<Support />} />
        </Route>
      </Route>

      {/* Technician area */}
      <Route path="/technician" element={<ProtectedRoute roles={['technician']} />}>
        <Route element={<TechnicianLayout />}>
          <Route index element={<TechnicianJobs />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="technicians" element={<AdminTechnicians />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
