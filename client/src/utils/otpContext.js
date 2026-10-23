// Remembers WHERE the OTP was sent (never the OTP itself) so the verify page survives a refresh.
const KEY = 'qf_otp_ctx';

export function saveOtpContext(ctx) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...ctx, savedAt: Date.now() }));
  } catch {
    /* storage blocked — router state still works */
  }
}

export function readOtpContext() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearOtpContext() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
