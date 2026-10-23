import { useState } from 'react';
import { paymentApi, quotationApi, technicianApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { TIME_SLOTS } from '../../config/site';
import ApplianceIcon from '../../components/ApplianceIcon';
import { EmptyState, ErrorBox, Modal, Notice, Spinner, StatCard, StatusBadge } from '../../components/ui';
import { addressLine, formatDate, formatINR } from '../../utils/format';

const FILTERS = [
  ['', 'All'],
  ['assigned', 'Assigned'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
];
const slotLabel = (v) => TIME_SLOTS.find((t) => t.value === v)?.label || v;

function QuotationForm({ job, onDone }) {
  const [items, setItems] = useState([{ description: '', amount: '' }]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const update = (idx, key, value) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));

  const submit = async (e) => {
    e.preventDefault();
    const clean = items.map((i) => ({ description: i.description.trim(), amount: Number(i.amount) }));
    if (clean.some((i) => i.description.length < 2)) {
      setError('Write what the charge is for (at least 2 letters), e.g. "Gas charging" or "Labour".');
      return;
    }
    if (clean.some((i) => !(i.amount >= 0) || i.amount > 200000 || Number.isNaN(i.amount))) {
      setError('Every line needs an amount between 0 and 2,00,000.');
      return;
    }
    setSaving(true);
    try {
      await quotationApi.create({ bookingId: job._id, items: clean, note: note.trim() });
      onDone('Quotation sent to the customer.');
    } catch (err) {
      // Show the exact field problem instead of only "Please fix the highlighted fields."
      const fields = Object.values(getFieldErrors(err));
      setError(fields.length ? fields.join(' ') : getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Notice type="danger" message={error} />
      <div className="row g-2 mb-1 small text-muted-qf">
        <div className="col-7">Work / part (e.g. Gas charging)</div>
        <div className="col-3">Amount (₹)</div>
      </div>
      {items.map((it, idx) => (
        <div className="row g-2 mb-2" key={idx}>
          <div className="col-7">
            <input className="form-control form-control-sm" aria-label={`Item ${idx + 1} description`} placeholder="Part or labour" maxLength={120} value={it.description} onChange={(e) => update(idx, 'description', e.target.value)} />
          </div>
          <div className="col-3">
            <input className="form-control form-control-sm" aria-label={`Item ${idx + 1} amount`} placeholder="₹" type="number" min="0" step="1" value={it.amount} onChange={(e) => update(idx, 'amount', e.target.value)} />
          </div>
          <div className="col-2 text-end">
            {items.length > 1 && (
              <button type="button" className="btn btn-sm btn-outline-danger" aria-label="Remove line" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>
        </div>
      ))}
      {items.length < 15 && (
        <button type="button" className="link-btn mb-3" onClick={() => setItems([...items, { description: '', amount: '' }])}>
          <i className="bi bi-plus" /> Add line
        </button>
      )}
      <textarea className="form-control form-control-sm mb-3" rows={2} maxLength={300} placeholder="Note for customer (optional)" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="d-flex justify-content-between align-items-center">
        <strong>Total: {formatINR(total)}</strong>
        <button type="submit" className="btn btn-teal btn-sm" disabled={saving}>{saving ? 'Sending…' : 'Send Quotation'}</button>
      </div>
    </form>
  );
}

export default function TechnicianJobs() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi(() => technicianApi.jobs({ status: status || undefined }), [status]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState('');
  const [quoteFor, setQuoteFor] = useState(null);

  const run = async (key, fn, okText) => {
    setBusy(key);
    setMsg({ type: '', text: '' });
    try {
      await fn();
      setMsg({ type: 'success', text: okText });
      reload();
    } catch (err) {
      setMsg({ type: 'danger', text: getErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const jobs = data?.jobs || [];
  const count = (s) => jobs.filter((j) => j.status === s).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Jobs</h1>
          <p>Jobs assigned to you by the admin</p>
        </div>
      </div>
      {!status && (
        <div className="row g-3 mb-3">
          <div className="col-4"><StatCard icon="bi-person-check" tone="blue" label="Assigned" value={count('assigned')} /></div>
          <div className="col-4"><StatCard icon="bi-tools" tone="amber" label="In Progress" value={count('in_progress')} /></div>
          <div className="col-4"><StatCard icon="bi-patch-check" tone="green" label="Completed" value={count('completed')} /></div>
        </div>
      )}
      <div className="filter-pills mb-3">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" className={status === v ? 'active' : ''} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <ErrorBox message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <div className="qf-card"><EmptyState icon="bi-tools" text="No jobs here yet." /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {jobs.map((j) => {
            const q = j.latestQuotation;
            return (
              <article className="qf-card qf-card-body" key={j._id}>
                <div className="d-flex flex-wrap gap-3 align-items-start">
                  <span className="thumb" style={{ width: 56, height: 56 }}><ApplianceIcon slug={j.service?.slug} size={42} /></span>
                  <div className="flex-grow-1 small">
                    <strong className="text-navy d-block fs-6">{j.service?.name} <span className="text-muted-qf small">#{j.bookingNo}</span></strong>
                    <div>{formatDate(j.scheduledDate)} · {slotLabel(j.timeSlot)}</div>
                    <div><i className="bi bi-person me-1" />{j.customer?.fullName} · <a href={`tel:+91${j.address?.contactPhone || j.customer?.phone}`}>+91 {j.address?.contactPhone || j.customer?.phone}</a></div>
                    <div><i className="bi bi-geo-alt me-1" />{addressLine(j.address)}</div>
                    {j.issueDescription && <div className="text-muted-qf mt-1">Problem: {j.issueDescription}</div>}
                    {q && <div className="mt-1">Quotation: <strong>{formatINR(q.total)}</strong> <StatusBadge status={q.status} /></div>}
                    {j.invoice && <div className="mt-1">Invoice {j.invoice.invoiceNo}: <strong>{formatINR(j.invoice.total)}</strong> <StatusBadge status={j.invoice.status} /></div>}
                  </div>
                  <StatusBadge status={j.status} />
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {j.status === 'assigned' && (
                    <button type="button" className="btn btn-navy btn-sm" disabled={Boolean(busy)} onClick={() => run(j._id + 's', () => technicianApi.updateStatus(j._id, { status: 'in_progress' }), 'Job started.')}>
                      Start Job
                    </button>
                  )}
                  {['assigned', 'in_progress'].includes(j.status) && q?.status !== 'accepted' && (
                    <button type="button" className="btn btn-outline-teal btn-sm" onClick={() => setQuoteFor(j)}>
                      {q?.status === 'pending' ? 'Replace Quotation' : 'Send Quotation'}
                    </button>
                  )}
                  {j.status === 'in_progress' && (
                    <button type="button" className="btn btn-teal btn-sm" disabled={Boolean(busy) || q?.status !== 'accepted'} title={q?.status !== 'accepted' ? 'Customer must accept a quotation first' : undefined} onClick={() => run(j._id + 'c', () => technicianApi.updateStatus(j._id, { status: 'completed' }), 'Job completed. Invoice created.')}>
                      Mark Completed
                    </button>
                  )}
                  {j.invoice?.status === 'unpaid' && (
                    <button type="button" className="btn btn-soft btn-sm" disabled={Boolean(busy)} onClick={() => run(j._id + 'p', () => paymentApi.recordCash(j.invoice._id), 'Cash payment recorded.')}>
                      <i className="bi bi-cash me-1" />Record Cash {formatINR(j.invoice.total)}
                    </button>
                  )}
                </div>
                {j.status === 'in_progress' && q?.status !== 'accepted' && (
                  <p className="small-xs text-muted-qf mt-2 mb-0">You can complete the job after the customer accepts a quotation.</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal show={Boolean(quoteFor)} title={`Quotation for #${quoteFor?.bookingNo || ''}`} onClose={() => setQuoteFor(null)}>
        {quoteFor && (
          <QuotationForm
            job={quoteFor}
            onDone={(text) => {
              setQuoteFor(null);
              setMsg({ type: 'success', text });
              reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}
