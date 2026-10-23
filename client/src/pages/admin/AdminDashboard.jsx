import { useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { EmptyState, ErrorBox, Notice, Pagination, Spinner, StatCard, StatusBadge } from '../../components/ui';
import { formatDate, formatINR } from '../../utils/format';

const FILTERS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['assigned', 'Assigned'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

export default function AdminDashboard() {
  const stats = useApi(() => adminApi.stats(), []);
  const techs = useApi(() => adminApi.users({ role: 'technician', limit: 50 }), []);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const bookings = useApi(() => adminApi.bookings({ status: status || undefined, page, limit: 10 }), [status, page]);
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const s = stats.data?.stats;
  const activeTechs = (techs.data?.users || []).filter((t) => t.isActive);

  const assign = async (b) => {
    const technicianId = choice[b._id];
    if (!technicianId) return setMsg({ type: 'warning', text: 'Choose a technician first.' });
    setBusy(b._id);
    try {
      await adminApi.assign(b._id, technicianId);
      setMsg({ type: 'success', text: `Booking #${b.bookingNo} assigned.` });
      bookings.reload();
      stats.reload();
    } catch (e) {
      setMsg({ type: 'danger', text: getErrorMessage(e) });
    } finally {
      setBusy('');
    }
    return undefined;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Admin Overview</h1>
          <p>Bookings, technicians and revenue</p>
        </div>
      </div>
      <ErrorBox message={stats.error} onRetry={stats.reload} />
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><StatCard icon="bi-people" label="Customers" value={s?.customers ?? '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-person-gear" tone="blue" label="Technicians" value={s?.technicians ?? '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-hourglass-split" tone="amber" label="Waiting for assignment" value={s?.bookings?.pending ?? '–'} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="bi-currency-rupee" tone="green" label="Collected revenue" value={s ? formatINR(s.revenue) : '–'} /></div>
      </div>

      <section className="qf-card qf-card-body">
        <div className="qf-card-head flex-wrap">
          <h2 className="qf-card-title">Bookings</h2>
          <div className="filter-pills">
            {FILTERS.map(([v, l]) => (
              <button key={v} type="button" className={status === v ? 'active' : ''} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>
            ))}
          </div>
        </div>
        <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
        <ErrorBox message={bookings.error} onRetry={bookings.reload} />
        {bookings.loading ? (
          <Spinner />
        ) : (bookings.data?.bookings || []).length === 0 ? (
          <EmptyState icon="bi-calendar" text="No bookings in this list." />
        ) : (
          <div className="table-responsive">
            <table className="table table-qf">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ minWidth: 260 }}>Technician</th>
                </tr>
              </thead>
              <tbody>
                {bookings.data.bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-600">#{b.bookingNo}</td>
                    <td>{b.customer?.fullName}<div className="small-xs text-muted-qf">{b.address?.city}</div></td>
                    <td>{b.service?.name}</td>
                    <td>{formatDate(b.scheduledDate)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {['pending', 'assigned'].includes(b.status) ? (
                        <div className="d-flex gap-2">
                          <select className="form-select form-select-sm" aria-label="Technician" value={choice[b._id] ?? b.technician?._id ?? ''} onChange={(e) => setChoice({ ...choice, [b._id]: e.target.value })}>
                            <option value="">Choose…</option>
                            {activeTechs.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                          </select>
                          <button type="button" className="btn btn-teal btn-sm" disabled={busy === b._id} onClick={() => assign(b)}>
                            {b.technician ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      ) : (
                        b.technician?.fullName || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={bookings.data?.page || 1} pages={bookings.data?.pages} onChange={setPage} />
      </section>
    </>
  );
}
