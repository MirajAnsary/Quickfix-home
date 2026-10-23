import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { PasswordInput } from '../../components/FormFields';
import { Notice, SubmitButton } from '../../components/ui';
import { authApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { rules, validateFields } from '../../utils/validators';

export default function ResetPassword() {
  // The reset token only lives in memory (router state). A page refresh means starting again — by design.
  const resetToken = useLocation().state?.resetToken;
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateFields(form, { password: rules.password, confirm: (v, all) => (v === all.password ? '' : 'Passwords do not match') });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await authApi.resetPassword({ resetToken, password: form.password });
      navigate('/login', { replace: true, state: { message: data.message } });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account" script={<>Stronger<br />Security</>} icon="bi-shield-check">
      {!resetToken ? (
        <>
          <Notice type="warning" message="Your reset session has expired or this page was opened directly. Please request a new code." />
          <Link to="/forgot-password" className="btn btn-teal w-100">Request new code</Link>
        </>
      ) : (
        <>
          <Notice type="danger" message={serverError} />
          <form onSubmit={submit} noValidate>
            <PasswordInput id="rp-pass" label="New Password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
            <PasswordInput id="rp-confirm" label="Confirm Password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            <SubmitButton loading={loading}>Reset Password</SubmitButton>
          </form>
        </>
      )}
      <p className="text-center small mt-3 mb-0">
        <Link to="/login">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
