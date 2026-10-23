import { useState } from 'react';
import { addressApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useArea } from '../../context/AreaContext';
import { Field } from '../../components/FormFields';
import { EmptyState, ErrorBox, Modal, Notice, Spinner, SubmitButton } from '../../components/ui';
import { addressLine } from '../../utils/format';
import { normalizePhone, rules, validateFields } from '../../utils/validators';

const EMPTY = { label: 'Home', line1: '', line2: '', landmark: '', city: '', district: 'Purulia', state: 'West Bengal', pincode: '', contactPhone: '' };
const SCHEMA = { line1: rules.required('Village / Locality'), city: rules.required('Area / City'), pincode: rules.pincode, contactPhone: rules.optionalPhone };

export default function MyAddresses() {
  const { data, loading, error, reload } = useApi(() => addressApi.list(), []);
  const { area, areas } = useArea();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {_id..} = edit
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(null);

  const open = (a) => {
    setEditing(a || {});
    setForm(a ? { ...EMPTY, ...a, contactPhone: a.contactPhone || '' } : { ...EMPTY, city: area });
    setErrors({});
    setFormError('');
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const errs = validateFields(form, SCHEMA);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const body = {
      label: form.label,
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      contactPhone: form.contactPhone ? normalizePhone(form.contactPhone) : '',
    };
    try {
      if (editing._id) await addressApi.update(editing._id, body);
      else await addressApi.create(body);
      setMsg({ type: 'success', text: editing._id ? 'Address updated.' : 'Address added.' });
      setEditing(null);
      reload();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const action = async (fn, okText) => {
    try {
      await fn();
      setMsg({ type: 'success', text: okText });
      reload();
    } catch (err) {
      setMsg({ type: 'danger', text: getErrorMessage(err) });
    }
  };

  const list = data?.addresses || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Saved Addresses</h1>
          <p>Where our technicians should come</p>
        </div>
        <button type="button" className="btn btn-teal btn-sm" onClick={() => open(null)}><i className="bi bi-plus-lg me-1" />Add Address</button>
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <ErrorBox message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <div className="qf-card"><EmptyState icon="bi-geo-alt" text="You have not saved any address yet." /></div>
      ) : (
        <div className="row g-3">
          {list.map((a) => (
            <div className="col-md-6" key={a._id}>
              <article className="qf-card qf-card-body h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong className="text-navy"><i className={`bi ${a.label === 'Office' ? 'bi-building' : 'bi-house'} text-teal me-2`} />{a.label}</strong>
                  {a.isDefault && <span className="badge bg-teal-soft text-teal">Default</span>}
                </div>
                <p className="small mb-1 flex-grow-1">{addressLine(a)}</p>
                {a.contactPhone && <p className="small text-muted-qf mb-2">Contact: +91 {a.contactPhone}</p>}
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-teal btn-sm" onClick={() => open(a)}>Edit</button>
                  {!a.isDefault && <button type="button" className="btn btn-soft btn-sm" onClick={() => action(() => addressApi.makeDefault(a._id), 'Default address updated.')}>Set Default</button>}
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setDeleting(a)}>Delete</button>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      <Modal show={Boolean(editing)} title={editing?._id ? 'Edit Address' : 'Add Address'} onClose={() => setEditing(null)}>
        <Notice type="danger" message={formError} />
        <form onSubmit={save} noValidate>
          <Field id="ad-label" as="select" label="Label" value={form.label} onChange={set('label')}>
            <option>Home</option>
            <option>Office</option>
            <option>Other</option>
          </Field>
          <Field id="ad-l1" label="Village / Locality" maxLength={120} value={form.line1} onChange={set('line1')} error={errors.line1} />
          <Field id="ad-l2" label="House no. / Para / Street (optional)" maxLength={120} value={form.line2} onChange={set('line2')} />
          <Field id="ad-lm" label="Landmark (optional)" maxLength={80} value={form.landmark} onChange={set('landmark')} />
          <div className="row">
            <Field id="ad-city" as="select" label="Area / City" className="col-6 mb-3" value={form.city} onChange={set('city')} error={errors.city}>
              {/* Keep an older free-text city selectable when editing. */}
              {[...areas, ...(form.city && !areas.includes(form.city) ? [form.city] : [])].map((c) => <option key={c} value={c}>{c}</option>)}
            </Field>
            <Field id="ad-pin" label="PIN Code" className="col-6 mb-3" inputMode="numeric" maxLength={6} value={form.pincode} onChange={set('pincode')} error={errors.pincode} />
            <Field id="ad-dist" label="District" className="col-6 mb-3" maxLength={60} value={form.district} onChange={set('district')} />
            <Field id="ad-state" label="State" className="col-6 mb-3" maxLength={60} value={form.state} onChange={set('state')} />
          </div>
          <Field id="ad-phone" label="Contact phone at this address (optional)" type="tel" maxLength={14} value={form.contactPhone} onChange={set('contactPhone')} error={errors.contactPhone} />
          <SubmitButton loading={saving}>Save Address</SubmitButton>
        </form>
      </Modal>

      <Modal show={Boolean(deleting)} title="Delete address?" onClose={() => setDeleting(null)}>
        <p className="small">{deleting && addressLine(deleting)}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={() => setDeleting(null)}>Keep</button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              const id = deleting._id;
              setDeleting(null);
              await action(() => addressApi.remove(id), 'Address deleted.');
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
