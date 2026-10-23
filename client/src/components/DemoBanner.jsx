import { USE_MOCK } from '../api/client';

export default function DemoBanner() {
  if (!USE_MOCK) return null;
  return (
    <div className="demo-banner" role="note">
      <i className="bi bi-info-circle me-1" />
      <strong>Demo mode:</strong> sample data only — nothing is saved to a server, no real OTP or payment. Demo OTP: <strong>123456</strong>
    </div>
  );
}
