import { Link } from 'react-router-dom';
import { addressApi, bookingApi, invoiceApi, paymentApi, reviewApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import ApplianceIcon from '../../components/ApplianceIcon';
import { EmptyState, ErrorBox, SectionCard, Spinner, StatCard, Stars, StatusBadge } from '../../components/ui';
import { addressLine, firstName, formatDate, formatINR, initials } from '../../utils/format';

const Block = ({ state, children }) => {
  if (state.loading) return <Spinner small />;
  if (state.error) return <ErrorBox message={state.error} onRetry={state.reload} />;
  return children;
};

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useApi(() => bookingApi.stats(), []);
  const recent = useApi(() => bookingApi.mine({ limit: 3 }), []);
  const addresses = useApi(() => addressApi.list(), []);
  const invoices = useApi(() => invoiceApi.mine({ limit: 3 }), []);
  const payments = useApi(() => paymentApi.mine({ limit: 3 }), []);
  const reviews = useApi(() => reviewApi.mine(), []);
  const s = stats.data?.stats;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {firstName(user.fullName)} 👋</h1>
          <p>Here&apos;s your service overview</p>
        </div>
      </div>

      <ErrorBox message={stats.error} onRetry={stats.reload} />
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><StatCard icon="bi-calendar-check" label="Total Bookings" value={s ? s.total : '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-patch-check" tone="green" label="Completed" value={s ? s.completed : '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-hourglass-split" tone="amber" label="In Progress / Pending" value={s ? s.active : '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-wallet2" tone="blue" label="Total Spent" value={s ? formatINR(s.totalSpent) : '–'} /></div>
      </div>

      <div className="row g-3">
        <div className="col-xl-8">
          <div className="row g-3">
            <div className="col-lg-7">
              <SectionCard title="Recent Bookings" action={{ to: '/my-bookings', label: 'View All' }} className="h-100">
                <Block state={recent}>
                  {(recent.data?.bookings || []).length === 0 ? (
                    <EmptyState icon="bi-calendar-plus" text="No bookings yet.">
                      <Link to="/book" className="btn btn-teal btn-sm mt-3">Book your first service</Link>
                    </EmptyState>
                  ) : (
                    recent.data.bookings.map((b) => (
                      <div className="list-row" key={b._id}>
                        <span className="thumb"><ApplianceIcon slug={b.service?.slug} size={32} /></span>
                        <div className="flex-grow-1 min-w-0">
                          <div className="title">{b.service?.name}</div>
                          <div className="meta">#{b.bookingNo} · {formatDate(b.scheduledDate)}</div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))
                  )}
                </Block>
              </SectionCard>
            </div>
            <div className="col-lg-5 d-flex flex-column gap-3">
              <SectionCard title="Saved Addresses" action={{ to: '/my-addresses', label: 'Manage' }}>
                <Block state={addresses}>
                  {(addresses.data?.addresses || []).length === 0 ? (
                    <EmptyState icon="bi-geo-alt" text="No saved address." />
                  ) : (
                    addresses.data.addresses.slice(0, 2).map((a) => (
                      <div className="list-row" key={a._id}>
                        <i className="bi bi-geo-alt-fill text-teal" />
                        <div className="min-w-0">
                          <div className="title">{a.label} {a.isDefault && <span className="badge bg-teal-soft text-teal ms-1">Default</span>}</div>
                          <div className="meta text-truncate">{addressLine(a)}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <Link to="/my-addresses" className="small fw-600 d-inline-block mt-2"><i className="bi bi-plus" /> Add Address</Link>
                </Block>
              </SectionCard>
              <div className="help-card">
                <i className="bi bi-headset big" aria-hidden="true" />
                <div>
                  <strong className="d-block">Need Help?</strong>
                  <span className="small d-block mb-2">Our support team is ready to help.</span>
                  <Link to="/support" className="btn btn-light btn-sm text-teal fw-600">Contact Support</Link>
                </div>
              </div>
            </div>
            <div className="col-12">
              <SectionCard title="Your Ratings" action={{ to: '/my-reviews', label: 'View All' }}>
                <Block state={reviews}>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Stars value={reviews.data?.average || 0} />
                      <strong className="text-navy">{(reviews.data?.average || 0).toFixed(1)}</strong>
                      <span className="small text-muted-qf">({reviews.data?.count || 0} reviews)</span>
                    </div>
                    <Link to="/my-reviews" className="btn btn-teal btn-sm">Write a Review</Link>
                  </div>
                </Block>
              </SectionCard>
            </div>
          </div>
        </div>

        <div className="col-xl-4 d-flex flex-column gap-3">
          <SectionCard title="Profile Information">
            <div className="d-flex align-items-center gap-3">
              <span className="avatar avatar-lg">{initials(user.fullName)}</span>
              <div className="min-w-0">
                <strong className="d-block text-navy">{user.fullName}</strong>
                <span className="small d-block text-muted-qf">+91 {user.phone}</span>
                <span className="small d-block text-muted-qf text-truncate">{user.email}</span>
              </div>
            </div>
            <Link to="/profile" className="btn btn-soft btn-sm mt-3">Edit Profile</Link>
          </SectionCard>

          <SectionCard title="Recent Invoices" action={{ to: '/my-invoices', label: 'View All' }}>
            <Block state={invoices}>
              {(invoices.data?.invoices || []).length === 0 ? (
                <EmptyState icon="bi-receipt" text="No invoices yet." />
              ) : (
                invoices.data.invoices.map((i) => (
                  <div className="list-row" key={i._id}>
                    <i className="bi bi-file-earmark-text text-teal fs-5" />
                    <div className="flex-grow-1">
                      <div className="title">{i.invoiceNo}</div>
                      <div className="meta">{i.booking?.service?.name} · {formatDate(i.createdAt)}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-600 small">{formatINR(i.total)}</div>
                      <StatusBadge status={i.status} />
                    </div>
                  </div>
                ))
              )}
            </Block>
          </SectionCard>

          <SectionCard title="Payment History" action={{ to: '/payment-history', label: 'View All' }}>
            <Block state={payments}>
              {(payments.data?.payments || []).length === 0 ? (
                <EmptyState icon="bi-credit-card" text="No payments yet." />
              ) : (
                payments.data.payments.map((p) => (
                  <div className="list-row" key={p._id}>
                    <i className={`bi ${p.method === 'cash' ? 'bi-cash' : 'bi-credit-card'} text-teal fs-5`} />
                    <div className="flex-grow-1">
                      <div className="title">{p.method === 'cash' ? 'Cash' : 'Razorpay'}</div>
                      <div className="meta">{p.invoice?.invoiceNo} · {formatDate(p.paidAt || p.createdAt)}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-600 small">{formatINR(p.amount)}</div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))
              )}
            </Block>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
