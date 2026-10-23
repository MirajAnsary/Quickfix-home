import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { maskEmail, maskPhone } from '../utils/format.js';

let transporter = null;
const smtpReady = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
const smsReady = () => {
  if (env.sms.provider === 'fast2sms') return Boolean(env.sms.fast2smsKey);
  if (env.sms.provider === 'twilio') return Boolean(env.sms.twilioSid && env.sms.twilioToken && env.sms.twilioFrom);
  return false;
};

export const deliveryStatus = () => ({ email: smtpReady(), sms: smsReady(), devConsole: env.otp.devLog });

const purposeText = (purpose) => (purpose === 'reset' ? 'reset your QuickFix Home password' : 'verify your QuickFix Home account');

async function sendEmail(to, code, purpose) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  const minutes = env.otp.ttlMinutes;
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `${code} is your QuickFix Home code`,
    text: `Use ${code} to ${purposeText(purpose)}. It expires in ${minutes} minutes. Do not share this code with anyone, including QuickFix staff.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e3e8ef;border-radius:12px">
      <h2 style="color:#0B1F3A;margin:0 0 8px">QuickFix <span style="color:#0D9488">Home</span></h2>
      <p style="color:#334155">Use this code to ${purposeText(purpose)}:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0B1F3A;margin:16px 0">${code}</p>
      <p style="color:#64748b;font-size:13px">It expires in ${minutes} minutes. Never share this code — QuickFix staff will never ask for it.</p>
    </div>`,
  });
}

async function sendSms(phone, code) {
  const text = `${code} is your QuickFix Home verification code. Valid for ${env.otp.ttlMinutes} minutes. Do not share it.`;
  let res;
  if (env.sms.provider === 'fast2sms') {
    // Fast2SMS "otp" route sends a fixed template with the code. DLT rules apply in India.
    res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: env.sms.fast2smsKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'otp', variables_values: code, numbers: phone }),
    });
  } else {
    const auth = Buffer.from(`${env.sms.twilioSid}:${env.sms.twilioToken}`).toString('base64');
    res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.sms.twilioSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: `+91${phone}`, From: env.sms.twilioFrom, Body: text }),
    });
  }
  // Never log the response body: some providers echo the message (and the code).
  if (!res.ok) throw new Error(`SMS provider responded with HTTP ${res.status}`);
}

/**
 * Sends the OTP by every configured channel. Returns masked destinations.
 * Throws 503 if nothing could be delivered. Never logs the code except in the
 * explicit development console mode (blocked in production by config).
 */
export async function deliverOtp(user, code, purpose) {
  const sentTo = [];
  const errors = [];
  if (smtpReady()) {
    try {
      await sendEmail(user.email, code, purpose);
      sentTo.push(maskEmail(user.email));
    } catch (e) {
      errors.push(`email: ${e.message}`);
    }
  }
  if (smsReady()) {
    try {
      await sendSms(user.phone, code);
      sentTo.push(maskPhone(user.phone));
    } catch (e) {
      errors.push(`sms: ${e.message}`);
    }
  }
  if (errors.length) console.error('[otp] delivery problem:', errors.join(' | '));
  if (sentTo.length) return sentTo;

  if (env.otp.devLog) {
    console.warn(`[DEV ONLY - OTP] ${maskEmail(user.email)} (${purpose}): ${code}`);
    return ['the server console (development mode)'];
  }
  throw new ApiError(503, 'We could not send the verification code right now. Please try again later.');
}
