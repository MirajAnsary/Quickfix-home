import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import DemoBanner from '../components/DemoBanner';
import { AreaSelect } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';

/** Shared sidebar layout for customer, technician and admin areas. */
export default function DashboardShell({ nav, roleLabel, showBookButton = false }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <DemoBanner />
      <aside className={`dash-sidebar ${open ? 'open' : ''}`} aria-label={`${roleLabel} menu`}>
        <div className="d-flex justify-content-between align-items-center">
          <Logo size="sm" />
          <button type="button" className="btn-close d-lg-none" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
        <div className="dash-user">
          <span className="avatar">{initials(user?.fullName)}</span>
          <div className="min-w-0">
            <strong className="text-truncate">{user?.fullName}</strong>
            <small>{user?.phone ? `+91 ${user.phone}` : roleLabel}</small>
          </div>
        </div>
        <nav>
          {nav.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `dash-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${icon}`} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button type="button" className="dash-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" aria-hidden="true" />
            Logout
          </button>
        </nav>
      </aside>
      {open && <div className="dash-backdrop d-lg-none" onClick={() => setOpen(false)} />}

      <div className="dash-main">
        <header className="dash-topbar d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="qf-icon-btn d-lg-none" aria-label="Open menu" onClick={() => setOpen(true)}>
              <i className="bi bi-list" />
            </button>
            <span className="badge rounded-pill bg-teal-soft text-teal fw-600 d-none d-sm-inline">{roleLabel}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <AreaSelect id="dash-area" />
            {showBookButton && (
              <Link to="/book" className="btn btn-teal btn-sm text-nowrap" aria-label="Book Service">
                <i className="bi bi-plus-lg me-1" />
                <span className="d-none d-sm-inline">Book Service</span>
                <span className="d-sm-none">Book</span>
              </Link>
            )}
            <Link to="/" className="qf-icon-btn" aria-label="Go to website home">
              <i className="bi bi-house" />
            </Link>
          </div>
        </header>
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
