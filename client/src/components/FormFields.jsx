import { useState } from 'react';

/** Input with a leading icon, like the design sheet. Label is visually hidden but read by screen readers. */
export function IconInput({ id, icon, label, error, ...props }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <div className={`qf-input ${error ? 'is-invalid' : ''}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
        <input id={id} className="form-control" placeholder={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      </div>
      {error && (
        <div id={`${id}-err`} className="qf-error">
          {error}
        </div>
      )}
    </div>
  );
}

export function PasswordInput({ id, label = 'Password', error, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <div className={`qf-input ${error ? 'is-invalid' : ''}`}>
        <i className="bi bi-lock" aria-hidden="true" />
        <input id={id} type={show ? 'text' : 'password'} className="form-control" placeholder={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} maxLength={72} {...props} />
        <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
      </div>
      {error && (
        <div id={`${id}-err`} className="qf-error">
          {error}
        </div>
      )}
    </div>
  );
}

/** Labelled field used inside dashboard forms. */
export function Field({ id, label, error, as = 'input', children, className = 'mb-3', ...props }) {
  const Tag = as;
  const cls = as === 'select' ? 'form-select' : 'form-control';
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Tag id={id} className={`${cls} ${error ? 'is-invalid' : ''}`} aria-invalid={Boolean(error)} {...props}>
        {children}
      </Tag>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
