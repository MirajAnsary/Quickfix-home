import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { IconInput, PasswordInput } from '../../components/FormFields';
import { Notice, SubmitButton } from '../../components/ui';
import { authApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { normalizePhone, rules, validateFields } from '../../utils/validators';
import { saveOtpContext } from '../../utils/otpContext';

const SCHEMA = {
  fullName: rules.fullName,
  phone: rules.phone,
  email: rules.email,
  password: rules.password,
  confirmPassword: (v, all) => (v && v === all.password ? '' : 'Passwords do not match'),
  agree: (v) => (v ? '' : 'Please accept the Terms and Privacy Policy'),
};

export default function Register() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '', agree: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validateFields(form, SCHEMA);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { data } = await authApi.register({
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      saveOtpContext({ identifier: data.identifier, purpose: 'register', sentTo: data.sentTo, resendAfter: data.resendAfter });
      navigate('/verify-otp');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join us for a better home service experience"
      script={<>Join QuickFix<br />Home Today!</>}
      icon="bi-house-gear-fill"
      features={[
        ['bi-lightning-charge', 'Fast Service'],
        ['bi-person-check', 'Trusted Technicians'],
        ['bi-shield-lock', 'Safe & Secure'],
      ]}
    >
      <Notice type="danger" message={serverError} onClose={() => setServerError('')} />
      <form onSubmit={submit} noValidate>
        <IconInput id="reg-name" icon="bi-person" label="Full Name" autoComplete="name" maxLength={80} value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
        <IconInput id="reg-phone" icon="bi-telephone" label="Phone Number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} value={form.phone} onChange={set('phone')} error={errors.phone} />
        <IconInput id="reg-email" icon="bi-envelope" label="Email Address" type="email" autoComplete="email" maxLength={120} value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordInput id="reg-pass" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordInput id="reg-confirm" label="Confirm Password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <div className="form-check small mb-3">
          <input id="agree" className="form-check-input" type="checkbox" checked={form.agree} onChange={set('agree')} />
          <label htmlFor="agree" className="form-check-label">
            I agree to the <Link to="/terms" target="_blank">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>
          </label>
          {errors.agree && <div className="qf-error">{errors.agree}</div>}
        </div>
        <SubmitButton loading={loading}>Create Account</SubmitButton>
      </form>
      <p className="text-center small mt-3 mb-0">
        Already have an account? <Link to="/login" className="fw-600">Login</Link>
      </p>
    </AuthLayout>
  );
}
