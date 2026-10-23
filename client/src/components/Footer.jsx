import { Link } from 'react-router-dom';
import Logo from './Logo';
import { SITE, telHref } from '../config/site';

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = [
    ['facebook', SITE.social.facebook, 'Facebook'],
    ['youtube', SITE.social.youtube, 'YouTube'],
    ['whatsapp', `https://wa.me/${SITE.whatsapp}`, 'WhatsApp'],
    ['instagram', SITE.social.instagram, 'Instagram'],
  ].filter(([, href]) => href);

  return (
    <footer className="qf-footer" id="contact">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <Logo light />
            <p className="mt-3 mb-0 small" style={{ maxWidth: 300 }}>
              Professional home appliance repair in {SITE.address} and nearby areas.
            </p>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Quick Links</h6>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/#services">Services</Link></li>
              <li><Link to="/#pricing">Pricing</Link></li>
              <li><Link to="/#why">About Us</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
            </ul>
          </div>
          <div className="col-6 col-lg-3">
            <h6>Our Services</h6>
            <ul>
              {['AC Repair', 'Fridge Repair', 'Geyser Repair', 'Mixer Grinder', 'Washing Machine', 'Microwave Oven'].map((s) => (
                <li key={s}><Link to={`/?q=${encodeURIComponent(s.split(' ')[0])}#services`}>{s}</Link></li>
              ))}
            </ul>
          </div>
          <div className="col-lg-3">
            <h6>Contact Us</h6>
            <ul>
              <li><a href={telHref(SITE.phone)}><i className="bi bi-telephone me-2" />{SITE.phone}</a></li>
              <li><a href={`mailto:${SITE.email}`}><i className="bi bi-envelope me-2" />{SITE.email}</a></li>
              <li><i className="bi bi-geo-alt me-2" />{SITE.address}</li>
            </ul>
            <div className="qf-social d-flex gap-2 mt-3">
              {socials.map(([icon, href, label]) => (
                <a key={icon} href={href} target="_blank" rel="noreferrer noopener" aria-label={label}>
                  <i className={`bi bi-${icon}`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-top" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
        <div className="container py-3 d-flex flex-wrap justify-content-between gap-2 small">
          <span>© {year} QuickFix Home. All rights reserved.</span>
          <span>
            <Link to="/privacy">Privacy Policy</Link> <span className="mx-2">|</span> <Link to="/terms">Terms &amp; Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
