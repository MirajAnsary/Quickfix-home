import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/site';
import { Spinner } from '../components/ui';

/**
 * Frontend guard only improves the experience. Real protection is on the backend:
 * every protected API checks the JWT and the role.
 */
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return <Outlet />;
}

/** Login / register pages: send already-logged-in users to their dashboard. */
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return <Outlet />;
}
