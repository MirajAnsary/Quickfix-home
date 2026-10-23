import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABEL } from '../utils/format';

export function StatusBadge({ status }) {
  return <span className={`badge-status ${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function StatCard({ icon, label, value, tone = 'teal' }) {
  return (
    <div className="qf-card stat-card">
      <span className={`stat-icon tone-${tone}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = 'Loading…', small = false }) {
  return (
    <div className={`d-flex align-items-center justify-content-center gap-2 text-muted-qf ${small ? 'py-2' : 'py-5'}`} role="status">
      <span className="spinner-border spinner-border-sm text-teal" aria-hidden="true" />
      <span className="small">{label}</span>
    </div>
  );
}

export function EmptyState({ icon = 'bi-inbox', text, children }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <p>{text}</p>
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2 py-2 small mb-3" role="alert">
      <span>
        <i className="bi bi-exclamation-triangle me-2" />
        {message}
      </span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Notice({ type = 'success', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} d-flex justify-content-between align-items-start gap-2 py-2 small`} role="status">
      <span>{message}</span>
      {onClose && <button type="button" className="btn-close btn-sm" aria-label="Dismiss" onClick={onClose} />}
    </div>
  );
}

/** Card with a title row and optional "View All" link — used across dashboard pages. */
export function SectionCard({ title, action, children, className = '' }) {
  return (
    <section className={`qf-card ${className}`}>
      <div className="qf-card-body">
        <div className="qf-card-head">
          <h2 className="qf-card-title">{title}</h2>
          {action && (
            <Link to={action.to} className="small fw-600">
              {action.label} <i className="bi bi-arrow-right" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Stars({ value = 0, size }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`} style={size ? { fontSize: size } : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${n <= Math.round(value) ? 'bi-star-fill' : 'bi-star'}`} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>
          <i className="bi bi-star-fill" />
        </button>
      ))}
    </div>
  );
}

export function Modal({ show, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="qf-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qf-modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { maxWidth: 720 } : undefined}>
        <div className="qf-modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="qf-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <nav className="d-flex justify-content-between align-items-center mt-3 small" aria-label="Pages">
      <button type="button" className="btn btn-sm btn-outline-teal" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" /> Previous
      </button>
      <span className="text-muted-qf">
        Page {page} of {pages}
      </span>
      <button type="button" className="btn btn-sm btn-outline-teal" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <i className="bi bi-chevron-right" />
      </button>
    </nav>
  );
}

export function SubmitButton({ loading, children, className = 'btn btn-teal w-100', ...props }) {
  return (
    <button type="submit" className={className} disabled={loading} {...props}>
      {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}
