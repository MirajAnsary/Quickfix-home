import { Link } from 'react-router-dom';

export function LogoMark({ size = 42, light = false }) {
  const house = light ? '#FFFFFF' : '#0B1F3A';
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 5 3 30h8v28h42V30h8z" fill={house} />
      <rect x="43" y="9" width="7" height="13" rx="1" fill={house} />
      <g transform="translate(32 41)">
        {teeth.map((deg) => (
          <rect key={deg} x="-2.6" y="-14" width="5.2" height="6" rx="1" fill="#0D9488" transform={`rotate(${deg})`} />
        ))}
        <circle r="10" fill="#0D9488" />
        <circle r="4.2" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 'md', light = false, to = '/' }) {
  const px = size === 'sm' ? 34 : size === 'lg' ? 54 : 42;
  return (
    <Link to={to} className={`d-inline-flex align-items-center gap-2 qf-logo-${size} ${light ? 'qf-logo-light' : ''}`} aria-label="QuickFix Home home page">
      <LogoMark size={px} light={light} />
      <span className="lh-1">
        <span className="qf-logo-name">
          QuickFix <span className="text-teal">Home</span>
        </span>
        <span className="qf-logo-tag d-block">Repair • Restore • Relax</span>
      </span>
    </Link>
  );
}
