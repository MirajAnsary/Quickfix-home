import Logo from '../components/Logo';
import DemoBanner from '../components/DemoBanner';

const Wave = () => (
  <svg className="wave" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 60 C 100 10, 200 110, 400 50 L400 120 L0 120 Z" fill="#0D9488" opacity=".25" />
    <path d="M0 85 C 120 40, 240 120, 400 80 L400 120 L0 120 Z" fill="#0D9488" opacity=".35" />
  </svg>
);

/** Two-column auth card: form on the left, teal illustration panel on the right (hidden on phones). */
export default function AuthLayout({ title, subtitle, script, icon = 'bi-house-gear', features, children }) {
  return (
    <div className="auth-page">
      <DemoBanner />
      <div className="auth-center">
        <div className="auth-shell">
          <div className="auth-form">
            <div className="text-center mb-4">
              <Logo />
            </div>
            <h1>{title}</h1>
            {subtitle && <p className="text-muted-qf small mb-4">{subtitle}</p>}
            {children}
          </div>
          <aside className="auth-art" aria-hidden="true">
            <div className="script">{script}</div>
            {features ? (
              <ul className="list-unstyled auth-features mt-4 position-relative" style={{ zIndex: 1 }}>
                {features.map(([i, t]) => (
                  <li key={t}>
                    <i className={`bi ${i}`} />
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="art-icon">
              <i className={`bi ${icon}`} />
            </div>
            <Wave />
          </aside>
        </div>
      </div>
    </div>
  );
}
