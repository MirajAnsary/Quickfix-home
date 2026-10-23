import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useArea } from '../context/AreaContext';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/site';

const SERVICE_LINKS = [
  ['AC Repair', 'ac'],
  ['Fridge Repair', 'fridge'],
  ['Geyser Repair', 'geyser'],
  ['Washing Machine', 'washing'],
  ['Mixer Grinder', 'mixer'],
  ['Microwave Oven', 'microwave'],
];

export function AreaSelect({ id = 'area-select' }) {
  const { area, setArea, areas } = useArea();
  return (
    <span className="qf-area">
      <i className="bi bi-geo-alt" aria-hidden="true" />
      <label htmlFor={id} className="visually-hidden">
        Service area
      </label>
      <select id={id} value={area} onChange={(e) => setArea(e.target.value)}>
        {areas.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>
    </span>
  );
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  const close = () => setOpen(false);
  const hashActive = (h) => pathname === '/' && hash === h;

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/?q=${encodeURIComponent(term.trim())}#services`);
  };

  const bookTarget = user?.role === 'customer' ? '/book' : user ? ROLE_HOME[user.role] : '/login?next=%2Fbook';

  return (
    <nav className="navbar navbar-expand-lg qf-navbar sticky-top py-2" aria-label="Main">
      <div className="container">
        <Logo size="sm" />
        <button className="navbar-toggler border-0" type="button" aria-controls="mainNav" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-3 text-navy`} />
        </button>
        <div id="mainNav" className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink end to="/" className={() => `nav-link ${pathname === '/' && !hash ? 'active' : ''}`} onClick={close}>
                Home
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle bg-transparent border-0" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                Services
              </button>
              <ul className="dropdown-menu border-0 shadow">
                {SERVICE_LINKS.map(([label, q]) => (
                  <li key={q}>
                    <Link className="dropdown-item small" to={`/?q=${q}#services`} onClick={close}>
                      {label}
                    </Link>
                  </li>
                ))}
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item small" to="/#services" onClick={close}>
                    All services
                  </Link>
                </li>
              </ul>
            </li>
            {[
              ['Pricing', '#pricing'],
              ['About', '#why'],
              ['Reviews', '#reviews'],
              ['Contact', '#contact'],
            ].map(([label, h]) => (
              <li className="nav-item" key={h}>
                <Link to={`/${h}`} className={`nav-link ${hashActive(h) ? 'active' : ''}`} onClick={close}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="d-flex flex-wrap align-items-center gap-2 pb-2 pb-lg-0 position-relative">
            <AreaSelect />
            <button type="button" className="qf-icon-btn" aria-label="Search services" aria-expanded={searchOpen} onClick={() => setSearchOpen((s) => !s)}>
              <i className="bi bi-search" />
            </button>
            {searchOpen && (
              <form className="qf-search-pop qf-card p-2 d-flex gap-2" onSubmit={submitSearch} role="search">
                <label htmlFor="nav-search" className="visually-hidden">
                  Search services
                </label>
                <input id="nav-search" autoFocus className="form-control form-control-sm" placeholder="e.g. AC, geyser" value={term} onChange={(e) => setTerm(e.target.value)} />
                <button className="btn btn-teal btn-sm" type="submit">
                  Go
                </button>
              </form>
            )}
            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-teal btn-sm dropdown-toggle" data-bs-toggle="dropdown" type="button" aria-expanded="false">
                  <i className="bi bi-person-circle me-1" /> {user.fullName.split(' ')[0]}
                </button>
                <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
                  <li>
                    <Link className="dropdown-item small" to={ROLE_HOME[user.role]} onClick={close}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button className="dropdown-item small" type="button" onClick={async () => { await logout(); navigate('/'); }}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline-teal btn-sm" onClick={close}>
                Login
              </Link>
            )}
            <Link to={bookTarget} className="btn btn-teal btn-sm" onClick={close}>
              Book Service
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
