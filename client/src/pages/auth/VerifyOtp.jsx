import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import OtpInput from '../../components/OtpInput';
import { Notice, SubmitButton, useCountdown } from '../../components/ui';
import { authApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { clearOtpContext, readOtpContext, saveOtpContext } from '../../utils/otpContext';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function VerifyOtp() {
  const ctx = readOtpContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const initialWait = ctx?.resendAfter ? Math.max(0, ctx.resendAfter - Math.floor((Date.now() - (ctx.savedAt || 0)) / 1000)) : 60;
  const [left, setLeft] = useCountdown(initialWait);

  if (!ctx?.identifier) return <Navigate to="/login" replace />;
  const isReset = ctx.purpose === 'reset';

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ identifier: ctx.identifier, purpose: ctx.purpose, code });
      clearOtpContext();
      if (isReset) {
        navigate('/reset-password', { replace: true, state: { resetToken: data.resetToken } });
      } else {
        setUser(data.user); // server set the auth cookie
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const { data } = await authApi.resendOtp({ identifier: ctx.identifier, purpose: ctx.purpose });
      saveOtpContext({ ...ctx, sentTo: data.sentTo || ctx.sentTo, resendAfter: data.resendAfter });
      setLeft(data.resendAfter || 60);
      setInfo(data.message || 'A new code has been sent.');
    } catch (err) {
      const wait = err?.response?.data?.details?.retryAfter;
      if (wait) setLeft(wait);
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const destination = ctx.sentTo?.length ? ctx.sentTo.join(' and ') : isReset ? 'your registered phone/email (if the account exists)' : 'your registered contact';

  return (
    <AuthLayout title="Verify OTP" subtitle={`Enter the 6 digit code sent to ${destination}`} script={<>Secure<br />Your Account</>} icon="bi-phone-vibrate">
      <Notice type="info" message={info} onClose={() => setInfo('')} />
      <Notice type="danger" message={error} />
      <form onSubmit={verify} noValidate>
        <div className="mb-3">
          <OtpInput value={code} onChange={setCode} disabled={loading} />
        </div>
        <div className="d-flex justify-content-between align-items-center small mb-4">
          <span className="fw-600 text-navy" aria-live="polite">{left > 0 ? fmt(left) : 'Didn’t get it?'}</span>
          <button type="button" className="link-btn" disabled={left > 0 || resending} onClick={resend}>
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>
        <SubmitButton loading={loading}>Verify</SubmitButton>
      </form>
      <p className="text-center small mt-3 mb-0">
        <Link to="/login" onClick={clearOtpContext}>Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
