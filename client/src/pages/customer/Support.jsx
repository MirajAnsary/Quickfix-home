import { useState } from 'react';
import { bookingApi, supportApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { SITE, telHref } from '../../config/site';
import { Field } from '../../components/FormFields';
import { EmptyState, ErrorBox, Notice, SectionCard, Spinner, StatusBadge, SubmitButton } from '../../components/ui';
import { formatDate } from '../../utils/format';

const FAQ = [
  ['How much does a visit cost?', 'Each service has a starting price shown on the home page. After inspection the technician sends a quotation. Work starts only after you accept it.'],
  ['When will a technician come?', 'Usually within 24–48 hours on the date and slot you choose. You will see the technician’s name once assigned.'],
  ['Can I cancel a booking?', 'Yes, from My Bookings while it is pending or assigned.'],
  ['How do I pay?', 'Pay online with Razorpay (UPI, cards, net banking) from Invoices, or pay cash to the technician.'],
];

export default function Support() {
  const tickets = useApi(() => supportApi.mine(), []);
  const bookings = useApi(() => bookingApi.mine({ limit: 20 }), []);
  const [form, setForm] = useState({ subject: '', bookingId: '', message: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.subject.trim().length < 3) errs.subject = 'Write a short subject (3+ characters)';
    if (form.message.trim().length < 10) errs.message = 'Describe the issue (10+ characters)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { data } = await supportApi.create({ subject: form.subject.trim(), message: form.message.trim(), bookingId: form.bookingId || undefined });
      setMsg({ type: 'success', text: `Ticket ${data.ticket.ticketNo} created. We will contact you soon.` });
      setForm({ subject: '', bookingId: '', message: '' });
      tickets.reload();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMsg({ type: 'danger', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Support</h1>
          <p>{SITE.supportHours}</p>
        </div>
      </div>
      <div className="row g-3 mb-3">
        {[
          ['bi-telephone-fill', 'Call Us', SITE.phone, telHref(SITE.phone)],
          ['bi-whatsapp', 'WhatsApp', 'Chat with us', `https://wa.me/${SITE.whatsapp}`],
          ['bi-envelope-fill', 'Email', SITE.email, `mailto:${SITE.email}`],
        ].map(([icon, t, s, href]) => (
          <div className="col-md-4" key={t}>
            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener" className="qf-card stat-card text-reset">
              <span className="stat-icon tone-teal"><i className={`bi ${icon}`} /></span>
              <div className="min-w-0">
                <div className="fw-600 text-navy">{t}</div>
                <div className="small text-muted-qf text-truncate">{s}</div>
              </div>
            </a>
          </div>
        ))}
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="row g-3">
        <div className="col-lg-6">
          <SectionCard title="Raise a Ticket">
            <form onSubmit={submit} noValidate>
              <Field id="t-subject" label="Subject" maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} error={errors.subject} />
              <Field id="t-booking" as="select" label="Related booking (optional)" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}>
                <option value="">None</option>
                {(bookings.data?.bookings || []).map((b) => <option key={b._id} value={b._id}>#{b.bookingNo} · {b.service?.name}</option>)}
              </Field>
              <Field id="t-message" as="textarea" rows={4} maxLength={1000} label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} />
              <SubmitButton loading={saving}>Submit Ticket</SubmitButton>
            </form>
          </SectionCard>
        </div>
        <div className="col-lg-6 d-flex flex-column gap-3">
          <SectionCard title="My Tickets">
            <ErrorBox message={tickets.error} onRetry={tickets.reload} />
            {tickets.loading ? (
              <Spinner small />
            ) : (tickets.data?.tickets || []).length === 0 ? (
              <EmptyState icon="bi-ticket-perforated" text="No tickets yet." />
            ) : (
              tickets.data.tickets.map((t) => (
                <div className="list-row" key={t._id}>
                  <div className="flex-grow-1">
                    <div className="title">{t.subject}</div>
                    <div className="meta">{t.ticketNo} · {formatDate(t.createdAt)}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </SectionCard>
          <SectionCard title="Frequently Asked Questions">
            <div className="accordion accordion-flush" id="faq">
              {FAQ.map(([q, a], i) => (
                <div className="accordion-item" key={q}>
                  <h3 className="accordion-header">
                    <button className="accordion-button collapsed small fw-600 px-0" type="button" data-bs-toggle="collapse" data-bs-target={`#faq-${i}`}>{q}</button>
                  </h3>
                  <div id={`faq-${i}`} className="accordion-collapse collapse" data-bs-parent="#faq">
                    <div className="accordion-body small px-0 pt-0">{a}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
