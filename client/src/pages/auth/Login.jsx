import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { IconInput, PasswordInput } from '../../components/FormFields';
import { Notice, SubmitButton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';
import { ROLE_HOME } from '../../config/site';
import { rules, validateFields } from '../../utils/validators';
import { saveOtpContext } from '../../utils/otpContext';

const ROLES = [
  ['customer', 'Customer'],
  ['technician', 'Technician'],
  ['admin', 'Admin'],
];

// Only allow redirects to our own customer pages (prevents open-redirect tricks).
const safeNext = (next, role) => (role === 'customer' && next && next.startsWith('/') && !next.startsWith('//') ? next : ROLE_HOME[role]);

export default function Login() {
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: true });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const flash = location.state?.message;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validateFields(form, { identifier: rules.identifier, password: rules.required('Password') });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const user = await login({ ...form, identifier: form.identifier.trim(), role });
      navigate(safeNext(params.get('next'), user.role), { replace: true });
    } catch (err) {
      const details = err?.response?.data?.details;
      if (details?.code === 'NOT_VERIFIED') {
        saveOtpContext({ identifier: details.identifier, purpose: 'register', sentTo: details.sentTo, resendAfter: details.resendAfter });
        navigate('/verify-otp', { state: { message: getErrorMessage(err) } });
        return;
      }
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back!" subtitle="Login to access your account" script={<>Trusted<br />Service for<br />Your Home</>} icon="bi-house-heart">
      <div className="role-tabs mb-4" role="tablist" aria-label="Login as">
        {ROLES.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={role === value} className={role === value ? 'active' : ''} onClick={() => setRole(value)}>
            {label}
          </button>
        ))}
      </div>
      <Notice type="success" message={flash} />
      <Notice type="danger" message={serverError} onClose={() => setServerError('')} />
      <form onSubmit={submit} noValidate>
        <IconInput id="login-id" icon="bi-telephone" label="Phone Number / Email" autoComplete="username" value={form.identifier} onChange={set('identifier')} error={errors.identifier} />
        <PasswordInput id="login-pass" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} />
        <div className="d-flex justify-content-between align-items-center mb-4 small">
          <div className="form-check">
            <input id="remember" className="form-check-input" type="checkbox" checked={form.rememberMe} onChange={set('rememberMe')} />
            <label htmlFor="remember" className="form-check-label">Remember me</label>
          </div>
          <Link to="/forgot-password" className="fw-600">Forgot password?</Link>
        </div>
        <SubmitButton loading={loading}>Login</SubmitButton>
      </form>
      {role === 'customer' ? (
        <>
          <div className="or-divider">OR</div>
          <p className="text-center small mb-0">
            Don&apos;t have an account? <Link to="/register" className="fw-600">Create Account</Link>
          </p>
        </>
      ) : (
        <p className="text-center small-xs text-muted-qf mt-3 mb-0">
          {role === 'technician' ? 'Technician accounts are created by the admin.' : 'Admin accounts are created from the server seed script.'}
        </p>
      )}
    </AuthLayout>
  );
}
