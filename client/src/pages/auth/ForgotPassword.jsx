import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { IconInput } from '../../components/FormFields';
import { Notice, SubmitButton } from '../../components/ui';
import { authApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { rules } from '../../utils/validators';
import { saveOtpContext } from '../../utils/otpContext';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const msg = rules.identifier(identifier);
    setError(msg);
    if (msg) return;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await authApi.forgotPassword({ identifier: identifier.trim() });
      saveOtpContext({ identifier: data.identifier, purpose: 'reset', resendAfter: data.resendAfter });
      navigate('/verify-otp', { state: { message: data.message } });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your phone number or email to receive OTP" script={<>Reset Your<br />Password</>} icon="bi-lock-fill">
      <Notice type="danger" message={serverError} />
      <form onSubmit={submit} noValidate>
        <IconInput id="fp-id" icon="bi-telephone" label="Phone Number / Email" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={error} />
        <SubmitButton loading={loading}>Send OTP</SubmitButton>
      </form>
      <p className="text-center small mt-3 mb-0">
        <Link to="/login">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
