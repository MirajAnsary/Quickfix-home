import { useState } from 'react';
import { adminApi, serviceApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Field } from '../../components/FormFields';
import { Modal, Notice, SubmitButton } from '../../components/ui';
import { normalizePhone, rules, validateFields } from '../../utils/validators';
import UserTable from './UserTable';

const EMPTY = { fullName: '', phone: '', email: '', password: '', skills: [] };

export default function AdminTechnicians() {
  const [page, setPage] = useState(1);
  const state = useApi(() => adminApi.users({ role: 'technician', page, limit: 15 }), [page]);
  const services = useApi(() => serviceApi.list(), []);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSkill = (slug) => setForm((f) => ({ ...f, skills: f.skills.includes(slug) ? f.skills.filter((s) => s !== slug) : [...f.skills, slug] }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateFields(form, { fullName: rules.fullName, phone: rules.phone, email: rules.email, password: rules.password });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await adminApi.createTechnician({ ...form, fullName: form.fullName.trim(), phone: normalizePhone(form.phone), email: form.email.trim().toLowerCase() });
      setShow(false);
      setForm(EMPTY);
      setMsg({ type: 'success', text: 'Technician account created. Share the login details with them privately.' });
      state.reload();
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
          <h1>Technicians</h1>
          <p>Create and manage technician accounts</p>
        </div>
        <button type="button" className="btn btn-teal btn-sm" onClick={() => { setShow(true); setErrors({}); }}>
          <i className="bi bi-plus-lg me-1" />Add Technician
        </button>
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <section className="qf-card qf-card-body">
        <UserTable state={state} page={page} onPage={setPage} showSkills />
      </section>

      <Modal show={show} title="Add Technician" onClose={() => setShow(false)}>
        <form onSubmit={submit} noValidate>
          <Field id="t-name" label="Full Name" maxLength={80} value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
          <div className="row">
            <Field id="t-phone" label="Phone" className="col-md-6 mb-3" type="tel" maxLength={14} value={form.phone} onChange={set('phone')} error={errors.phone} />
            <Field id="t-email" label="Email" className="col-md-6 mb-3" type="email" maxLength={120} value={form.email} onChange={set('email')} error={errors.email} />
          </div>
          <Field id="t-pass" label="Temporary Password" type="password" autoComplete="new-password" maxLength={72} value={form.password} onChange={set('password')} error={errors.password} />
          <span className="form-label d-block">Skills</span>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {(services.data?.services || []).map((s) => (
              <button key={s._id} type="button" className={`btn btn-sm ${form.skills.includes(s.slug) ? 'btn-teal' : 'btn-outline-teal'}`} aria-pressed={form.skills.includes(s.slug)} onClick={() => toggleSkill(s.slug)}>
                {s.name}
              </button>
            ))}
          </div>
          <SubmitButton loading={saving}>Create Technician</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
