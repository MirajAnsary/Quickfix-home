import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingApi, reviewApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Field } from '../../components/FormFields';
import { EmptyState, ErrorBox, Notice, SectionCard, Spinner, StarInput, Stars, SubmitButton } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function MyReviews() {
  const [params] = useSearchParams();
  const reviews = useApi(() => reviewApi.mine(), []);
  const completed = useApi(() => bookingApi.mine({ status: 'completed', limit: 50 }), []);
  const [form, setForm] = useState({ bookingId: '', rating: 0, comment: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const reviewable = (completed.data?.bookings || []).filter((b) => !b.hasReview);

  useEffect(() => {
    const id = params.get('booking');
    if (id && reviewable.some((b) => b._id === id)) setForm((f) => ({ ...f, bookingId: id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed.data]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.bookingId) errs.bookingId = 'Choose a completed booking';
    if (!form.rating) errs.rating = 'Choose a star rating';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await reviewApi.create({ ...form, comment: form.comment.trim() });
      setMsg({ type: 'success', text: 'Thank you for your review!' });
      setForm({ bookingId: '', rating: 0, comment: '' });
      reviews.reload();
      completed.reload();
    } catch (err) {
      setMsg({ type: 'danger', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const list = reviews.data?.reviews || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ratings &amp; Reviews</h1>
          <p>Rate completed services</p>
        </div>
        <div className="qf-card px-3 py-2 d-flex align-items-center gap-2">
          <Stars value={reviews.data?.average || 0} />
          <strong className="text-navy">{(reviews.data?.average || 0).toFixed(1)}</strong>
          <span className="small text-muted-qf">({reviews.data?.count || 0})</span>
        </div>
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="row g-3">
        <div className="col-lg-5">
          <SectionCard title="Write a Review">
            {completed.loading ? (
              <Spinner small />
            ) : reviewable.length === 0 ? (
              <EmptyState icon="bi-star" text="No completed bookings waiting for a review." />
            ) : (
              <form onSubmit={submit} noValidate>
                <Field id="rv-booking" as="select" label="Booking" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} error={errors.bookingId}>
                  <option value="">Select a completed booking</option>
                  {reviewable.map((b) => <option key={b._id} value={b._id}>{b.service?.name} · #{b.bookingNo} · {formatDate(b.scheduledDate)}</option>)}
                </Field>
                <div className="mb-3">
                  <span className="form-label d-block">Rating</span>
                  <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
                  {errors.rating && <div className="qf-error">{errors.rating}</div>}
                </div>
                <Field id="rv-comment" as="textarea" rows={4} maxLength={500} label="Your experience (optional)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
                <SubmitButton loading={saving}>Submit Review</SubmitButton>
              </form>
            )}
          </SectionCard>
        </div>
        <div className="col-lg-7">
          <SectionCard title="Your Reviews">
            <ErrorBox message={reviews.error} onRetry={reviews.reload} />
            {reviews.loading ? (
              <Spinner small />
            ) : list.length === 0 ? (
              <EmptyState icon="bi-chat-square-text" text="You have not written any reviews yet." />
            ) : (
              list.map((r) => (
                <div className="list-row align-items-start" key={r._id}>
                  <i className="bi bi-chat-square-quote text-teal fs-5" />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between flex-wrap gap-1">
                      <span className="title">{r.service?.name} <span className="meta">#{r.booking?.bookingNo}</span></span>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="small mb-1">{r.comment}</p>}
                    <span className="meta">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
