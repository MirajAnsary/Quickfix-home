import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { reviewApi, serviceApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useArea } from '../../context/AreaContext';
import { SITE, ROLE_HOME, telHref } from '../../config/site';
import HeroArt from '../../components/HeroArt';
import ServiceImage from '../../components/ServiceImage';
import { ErrorBox, Modal, Spinner, Stars } from '../../components/ui';
import { formatINR, initials } from '../../utils/format';

const TRUST = [
  ['bi-person-check', 'Trusted', 'Technicians'],
  ['bi-tag', 'Transparent', 'Pricing'],
  ['bi-clock-history', 'On-Time', 'Service'],
  ['bi-hand-thumbs-up', '100%', 'Satisfaction'],
];
const STRIP = [
  ['bi-lightning-charge', 'Fast Service', 'Within 24-48 Hours'],
  ['bi-shield-check', 'Verified Technicians', 'Background Checked'],
  ['bi-cash-coin', 'Transparent Pricing', 'No Hidden Charges'],
  ['bi-headset', '24/7 Support', 'Call, Chat, Help'],
];
const WHY = ['Experienced & Verified Technicians', 'Affordable & Transparent Pricing', 'Online Booking & Secure Payment', 'Service Warranty', 'Customer Satisfaction Guaranteed'];
const STEPS = [
  ['bi-calendar2-check', 'Book Service', 'Choose service & slot'],
  ['bi-person-gear', 'Get Expert', 'Technician at your home'],
  ['bi-wrench-adjustable', 'Repair & Verify', 'Check & confirm service'],
  ['bi-credit-card-2-front', 'Pay & Rate', 'Online or Cash & feedback'],
];

export default function Home() {
  const services = useApi(() => serviceApi.list(), []);
  const reviews = useApi(() => reviewApi.publicList(), []);
  const { user } = useAuth();
  const { area, setArea, areas } = useArea();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState(null);

  const q = (params.get('q') || '').toLowerCase().trim();
  const list = services.data?.services || [];
  const visible = useMemo(
    () => (q ? list.filter((s) => `${s.name} ${s.shortDescription} ${(s.issues || []).join(' ')}`.toLowerCase().includes(q)) : list),
    [list, q]
  );

  const book = (slug) => {
    const target = `/book${slug ? `?service=${slug}` : ''}`;
    if (!user) return navigate(`/login?next=${encodeURIComponent(target)}`);
    if (user.role !== 'customer') return navigate(ROLE_HOME[user.role]);
    return navigate(target);
  };

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="qf-hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="qf-pill">{area}&apos;s Trusted Home Appliance Service</span>
              <h1 className="mt-3 mb-3">
                Your Home Appliances
                <br />
                Our <span style={{ color: '#2DD4BF' }}>Expert Care</span>
              </h1>
              <p className="lead mb-4">
                Book professional technicians for AC, Geyser, Fridge, Mixer, Washing Machine &amp; Microwave repair services in {area} and nearby areas.
              </p>
              <form
                className="qf-search mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  book(selected);
                }}
              >
                <div className="seg">
                  <i className="bi bi-geo-alt-fill text-teal" aria-hidden="true" />
                  <label htmlFor="hero-area" className="visually-hidden">Area</label>
                  <select id="hero-area" className="form-select" value={area} onChange={(e) => setArea(e.target.value)}>
                    {areas.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <span className="divider" />
                <div className="seg">
                  <label htmlFor="hero-service" className="visually-hidden">Service</label>
                  <select id="hero-service" className="form-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <option value="">Select Service</option>
                    {list.map((s) => <option key={s._id} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-teal">
                  Book Now <i className="bi bi-arrow-right ms-1" />
                </button>
              </form>
              <div className="qf-trust">
                {TRUST.map(([icon, a, b]) => (
                  <div className="qf-trust-item" key={a}>
                    <i className={`bi ${icon}`} aria-hidden="true" />
                    <span>{a}<br />{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <HeroArt />
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ---------------- Services ---------------- */}
        <section className="qf-section" id="services" style={{ scrollMarginTop: 80 }}>
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">
            <div>
              <h2 className="section-title">Our Services</h2>
              <p className="section-sub mb-0">Expert repair &amp; maintenance for all your home appliances</p>
            </div>
            {q ? (
              <Link to="/#services" className="small fw-600">Clear search “{q}” <i className="bi bi-x" /></Link>
            ) : (
              <button type="button" className="link-btn" onClick={() => book('')}>Book any service <i className="bi bi-arrow-right" /></button>
            )}
          </div>
          {services.loading && <Spinner label="Loading services…" />}
          <ErrorBox message={services.error} onRetry={services.reload} />
          {!services.loading && !services.error && visible.length === 0 && (
            <p className="text-muted-qf">No service matches “{q}”. <Link to="/#services">Show all services</Link></p>
          )}
          <div className="row g-3">
            {visible.map((s) => (
              <div className="col-6 col-md-4 col-xl-2" key={s._id}>
                <article className="qf-card service-card">
                  <div className="icon-wrap"><ServiceImage slug={s.slug} alt={s.name} /></div>
                  <h3>{s.name}</h3>
                  <p>{s.shortDescription}</p>
                  <button type="button" className="link-btn" onClick={() => setDetail(s)}>
                    View Details <i className="bi bi-arrow-right" />
                  </button>
                </article>
              </div>
            ))}
          </div>

          <div className="qf-strip mt-4">
            <div className="row g-3">
              {STRIP.map(([icon, t, s]) => (
                <div className="col-sm-6 col-lg-3 qf-strip-col" key={t}>
                  <div className="qf-strip-item">
                    <i className={`bi ${icon}`} aria-hidden="true" />
                    <div><strong>{t}</strong><span>{s}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Why / Prices / How ---------------- */}
        <section className="qf-section">
          <div className="row g-4">
            <div className="col-lg-3" id="why" style={{ scrollMarginTop: 80 }}>
              <h2 className="h5 fw-bold mb-3">Why Choose QuickFix Home?</h2>
              <ul className="check-list">
                {WHY.map((w) => (
                  <li key={w}><i className="bi bi-check-circle-fill" aria-hidden="true" />{w}</li>
                ))}
              </ul>
              <a href="#how" className="btn btn-teal btn-sm">Learn More <i className="bi bi-arrow-right ms-1" /></a>
            </div>
            <div className="col-lg-4" id="pricing" style={{ scrollMarginTop: 80 }}>
              <div className="qf-card qf-card-body h-100">
                <h2 className="h5 fw-bold mb-3">Service Price List <span className="small fw-normal text-muted-qf">(Starting From)</span></h2>
                <table className="table price-table">
                  <tbody>
                    {list.map((s) => (
                      <tr key={s._id}>
                        <td>{s.name}</td>
                        <td className="text-end fw-600">{formatINR(s.startingPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="small-xs text-muted-qf mt-2 mb-0">*Final cost may vary based on issue &amp; parts. You approve the quotation before work starts.</p>
              </div>
            </div>
            <div className="col-lg-5" id="how" style={{ scrollMarginTop: 80 }}>
              <div className="how-box">
                <h2 className="h5 fw-bold text-center mb-3">How It Works?</h2>
                <div className="row g-2">
                  {STEPS.map(([icon, t, s], i) => (
                    <div className="col-6 col-sm-3 text-center" key={t}>
                      <span className="step-num">{i + 1}</span>
                      <div className="step-card">
                        <i className={`bi ${icon}`} aria-hidden="true" />
                        <strong>{t}</strong>
                        <span>{s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Reviews + CTA ---------------- */}
        <section className="qf-section" id="reviews" style={{ scrollMarginTop: 80 }}>
          <div className="row g-4">
            <div className="col-lg-8">
              <h2 className="section-title h4">What Our Customers Say</h2>
              <p className="section-sub">Reviews from customers who completed a booking</p>
              {reviews.loading && <Spinner small label="Loading reviews…" />}
              <ErrorBox message={reviews.error} onRetry={reviews.reload} />
              {!reviews.loading && !reviews.error && (reviews.data?.reviews || []).length === 0 && (
                <p className="text-muted-qf small">Reviews will appear here after customers rate completed services.</p>
              )}
              <div className="row g-3">
                {(reviews.data?.reviews || []).slice(0, 3).map((r) => (
                  <div className="col-md-4" key={r._id}>
                    <article className="qf-card qf-card-body h-100">
                      <div className="d-flex gap-2 align-items-center mb-2">
                        <span className="avatar">{initials(r.customerName)}</span>
                        <div>
                          <strong className="small d-block text-navy">{r.customerName}</strong>
                          <span className="small-xs text-muted-qf">{r.city}</span>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                      <p className="small mt-2 mb-0">“{r.comment}”</p>
                    </article>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="cta-card">
                <h2 className="h5 text-white fw-bold mb-1">Need Help? Book Now!</h2>
                <p className="small mb-3" style={{ color: '#d1fae5' }}>Get your home appliances repaired by our expert technicians today.</p>
                <a className="cta-phone mb-3" href={telHref(SITE.phone)}>
                  <i className="bi bi-telephone-fill text-teal" /> {SITE.phone}
                </a>
                <div className="d-flex justify-content-center flex-wrap gap-2">
                  <span className="pay-chip">UPI</span>
                  <span className="pay-chip">Razorpay</span>
                  <span className="pay-chip"><i className="bi bi-cash me-1" />Cash</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- Service detail modal ---------------- */}
      <Modal show={Boolean(detail)} title={detail?.name || ''} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="d-flex gap-3 align-items-center mb-3">
              <div className="thumb bg-white" style={{ width: 110, height: 80 }}><ServiceImage slug={detail.slug} alt={detail.name} height={70} /></div>
              <div>
                <div className="small text-muted-qf">Starting from</div>
                <div className="h4 fw-bold text-teal mb-0">{formatINR(detail.startingPrice)}</div>
              </div>
            </div>
            <h3 className="h6">Common problems we fix</h3>
            <ul className="check-list">
              {(detail.issues || []).map((i) => (
                <li key={i}><i className="bi bi-check2" />{i}</li>
              ))}
            </ul>
            <p className="small-xs text-muted-qf">The technician inspects first and sends a quotation. Work starts only after you accept it.</p>
            <button type="button" className="btn btn-teal w-100" onClick={() => book(detail.slug)}>
              Book {detail.name}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
