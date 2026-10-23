import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { bookingApi, quotationApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { TIME_SLOTS } from '../../config/site';
import ApplianceIcon from '../../components/ApplianceIcon';
import { EmptyState, ErrorBox, Modal, Notice, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { addressLine, formatDate, formatDateTime, formatINR, STATUS_LABEL } from '../../utils/format';
import { downloadInvoicePdf } from '../../utils/invoiceActions';

const FILTERS = [
  ['', 'All'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];
const slotLabel = (v) => TIME_SLOTS.find((t) => t.value === v)?.label || v;

function BookingDetails({ id, onChanged }) {
  const { data, loading, error, reload } = useApi(() => bookingApi.get(id), [id]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (loading) return <Spinner small />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { booking, quotations = [], invoice } = data;

  const respond = async (qid, action) => {
    setBusy(qid + action);
    try {
      await quotationApi.respond(qid, action);
      setMsg({ type: 'success', text: action === 'accept' ? 'Quotation accepted. The technician can start the work.' : 'Quotation rejected. The technician may send a new one.' });
      reload();
      onChanged();
    } catch (e) {
      setMsg({ type: 'danger', text: getErrorMessage(e) });
    } finally {
      setBusy('');
    }
  };

  const download = async () => {
    setBusy('pdf');
    try {
      await downloadInvoicePdf(invoice);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="border-top pt-3 mt-3">
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="row g-3 small">
        <div className="col-md-6">
          <h3 className="h6">Details</h3>
          <p className="mb-1"><strong>Address:</strong> {addressLine(booking.address)}</p>
          <p className="mb-1"><strong>Slot:</strong> {formatDate(booking.scheduledDate)}, {slotLabel(booking.timeSlot)}</p>
          {booking.issueDescription && <p className="mb-1"><strong>Problem:</strong> {booking.issueDescription}</p>}
          {booking.technician ? (
            <p className="mb-1"><strong>Technician:</strong> {booking.technician.fullName} · <a href={`tel:+91${booking.technician.phone}`}>Call</a></p>
          ) : (
            <p className="mb-1 text-muted-qf">A technician will be assigned soon.</p>
          )}
          {booking.cancelReason && <p className="mb-1"><strong>Cancel reason:</strong> {booking.cancelReason}</p>}
        </div>
        <div className="col-md-6">
          <h3 className="h6">Status History</h3>
          <ul className="timeline">
            {(booking.statusHistory || []).map((h, i) => (
              <li key={i}>
                <strong>{STATUS_LABEL[h.status] || h.status}</strong> <span className="text-muted-qf">· {formatDateTime(h.at)}</span>
                {h.note && <div className="text-muted-qf">{h.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {quotations.length > 0 && (
        <div className="mt-3">
          <h3 className="h6">Quotations</h3>
          {quotations.map((q) => (
            <div key={q._id} className="border rounded-3 p-3 mb-2 small">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>{formatINR(q.total)}</strong>
                <StatusBadge status={q.status} />
              </div>
              <ul className="mb-2 ps-3">
                {q.items.map((it, i) => <li key={i}>{it.description} — {formatINR(it.amount)}</li>)}
              </ul>
              {q.note && <p className="text-muted-qf mb-2">{q.note}</p>}
              {q.status === 'pending' && (
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-teal btn-sm" disabled={Boolean(busy)} onClick={() => respond(q._id, 'accept')}>
                    {busy === q._id + 'accept' ? 'Accepting…' : 'Accept'}
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm" disabled={Boolean(busy)} onClick={() => respond(q._id, 'reject')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {invoice && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 small">
          <span>Invoice <strong>{invoice.invoiceNo}</strong> · {formatINR(invoice.total)}</span>
          <StatusBadge status={invoice.status} />
          <button type="button" className="btn btn-outline-teal btn-sm" disabled={busy === 'pdf'} onClick={download}>
            <i className="bi bi-download me-1" />{busy === 'pdf' ? 'Preparing…' : 'PDF'}
          </button>
          {invoice.status === 'unpaid' && <Link to="/my-invoices" className="btn btn-teal btn-sm">Pay now</Link>}
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const location = useLocation();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [flash, setFlash] = useState(location.state?.message || '');
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useApi(() => bookingApi.mine({ status: status || undefined, page, limit: 8 }), [status, page]);

  const confirmCancel = async () => {
    setBusy(true);
    setCancelError('');
    try {
      await bookingApi.cancel(cancelling._id, reason.trim());
      setFlash(`Booking #${cancelling.bookingNo} cancelled.`);
      setCancelling(null);
      setReason('');
      reload();
    } catch (e) {
      setCancelError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Bookings</h1>
          <p>Track your service requests</p>
        </div>
        <Link to="/book" className="btn btn-teal btn-sm"><i className="bi bi-plus-lg me-1" />New Booking</Link>
      </div>
      <Notice type="success" message={flash} onClose={() => setFlash('')} />
      <div className="filter-pills mb-3" role="tablist">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={status === v} className={status === v ? 'active' : ''} onClick={() => { setStatus(v); setPage(1); setOpenId(null); }}>
            {l}
          </button>
        ))}
      </div>
      <ErrorBox message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (data?.bookings || []).length === 0 ? (
        <div className="qf-card"><EmptyState icon="bi-calendar-x" text="No bookings found."><Link to="/book" className="btn btn-teal btn-sm mt-3">Book a Service</Link></EmptyState></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {data.bookings.map((b) => (
            <article key={b._id} className="qf-card qf-card-body">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <span className="thumb" style={{ width: 56, height: 56 }}><ApplianceIcon slug={b.service?.slug} size={42} /></span>
                <div className="flex-grow-1">
                  <strong className="text-navy d-block">{b.service?.name}</strong>
                  <span className="small text-muted-qf">#{b.bookingNo} · {formatDate(b.scheduledDate)} · {slotLabel(b.timeSlot)}</span>
                </div>
                <StatusBadge status={b.status} />
                <div className="d-flex gap-2">
                  {['pending', 'assigned'].includes(b.status) && (
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => { setCancelling(b); setCancelError(''); }}>Cancel</button>
                  )}
                  {b.status === 'completed' && !b.hasReview && (
                    <Link to={`/my-reviews?booking=${b._id}`} className="btn btn-soft btn-sm"><i className="bi bi-star me-1" />Review</Link>
                  )}
                  <button type="button" className="btn btn-outline-teal btn-sm" aria-expanded={openId === b._id} onClick={() => setOpenId(openId === b._id ? null : b._id)}>
                    {openId === b._id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>
              {openId === b._id && <BookingDetails id={b._id} onChanged={reload} />}
            </article>
          ))}
        </div>
      )}
      <Pagination page={data?.page || 1} pages={data?.pages} onChange={setPage} />

      <Modal show={Boolean(cancelling)} title={`Cancel booking #${cancelling?.bookingNo || ''}`} onClose={() => setCancelling(null)}>
        <Notice type="danger" message={cancelError} />
        <label htmlFor="cancel-reason" className="form-label">Reason (optional)</label>
        <textarea id="cancel-reason" className="form-control mb-3" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={() => setCancelling(null)}>Keep Booking</button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={confirmCancel}>{busy ? 'Cancelling…' : 'Cancel Booking'}</button>
        </div>
      </Modal>
    </>
  );
}
