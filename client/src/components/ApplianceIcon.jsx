// Simple, original line illustrations for each appliance (no stock images needed).
const N = '#0B1F3A';
const T = '#0D9488';
const G = '#CBD5E1';

const ICONS = {
  'ac-repair': (
    <>
      <rect x="6" y="20" width="68" height="24" rx="6" fill="#fff" stroke={N} strokeWidth="2.5" />
      <path d="M12 36h56" stroke={G} strokeWidth="2" />
      <path d="M14 40h52" stroke={G} strokeWidth="2" />
      <circle cx="64" cy="27" r="2.2" fill={T} />
      <path d="M22 52c0 4 4 4 4 8M40 52c0 4 4 4 4 8M58 52c0 4 4 4 4 8" stroke={T} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  'fridge-repair': (
    <>
      <rect x="22" y="6" width="36" height="68" rx="5" fill="#fff" stroke={N} strokeWidth="2.5" />
      <path d="M22 30h36" stroke={N} strokeWidth="2.5" />
      <rect x="26" y="14" width="3" height="10" rx="1.5" fill={T} />
      <rect x="26" y="36" width="3" height="16" rx="1.5" fill={T} />
      <rect x="26" y="74" width="6" height="3" fill={N} />
      <rect x="48" y="74" width="6" height="3" fill={N} />
    </>
  ),
  'geyser-repair': (
    <>
      <rect x="24" y="6" width="32" height="56" rx="16" fill="#fff" stroke={N} strokeWidth="2.5" />
      <circle cx="40" cy="44" r="5" fill="none" stroke={T} strokeWidth="2.5" />
      <path d="M40 41v3" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 62v10h-4M48 62v10h4" stroke={N} strokeWidth="2.5" fill="none" />
      <path d="M30 20h20" stroke={G} strokeWidth="2" />
    </>
  ),
  'washing-machine-repair': (
    <>
      <rect x="14" y="6" width="52" height="66" rx="6" fill="#fff" stroke={N} strokeWidth="2.5" />
      <path d="M14 20h52" stroke={N} strokeWidth="2" />
      <circle cx="22" cy="13" r="2" fill={T} />
      <rect x="44" y="11" width="16" height="4" rx="2" fill={G} />
      <circle cx="40" cy="46" r="16" fill="#fff" stroke={N} strokeWidth="2.5" />
      <path d="M27 50c6-4 10 4 16 0s9-2 10 0a13 13 0 0 1-26 0z" fill={T} opacity=".85" />
    </>
  ),
  'mixer-grinder-repair': (
    <>
      <path d="M26 40h28l-3-30H29z" fill="#fff" stroke={N} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M54 16h6v18h-7" stroke={N} strokeWidth="2.5" fill="none" />
      <rect x="30" y="4" width="20" height="6" rx="2" fill={N} />
      <path d="M33 30h14" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 44h40l-4 28H24z" fill={N} />
      <circle cx="40" cy="58" r="5" fill={T} />
    </>
  ),
  'microwave-oven-repair': (
    <>
      <rect x="6" y="16" width="68" height="44" rx="6" fill="#fff" stroke={N} strokeWidth="2.5" />
      <rect x="12" y="22" width="40" height="32" rx="3" fill="#E2F3F1" stroke={N} strokeWidth="2" />
      <path d="M56 22v32" stroke={G} strokeWidth="2" />
      <circle cx="65" cy="28" r="3" fill={T} />
      <circle cx="65" cy="38" r="2" fill={N} />
      <circle cx="65" cy="46" r="2" fill={N} />
      <rect x="14" y="60" width="6" height="4" fill={N} />
      <rect x="60" y="60" width="6" height="4" fill={N} />
    </>
  ),
};

export default function ApplianceIcon({ slug, size = 72, title }) {
  const art = ICONS[slug] || (
    <path d="M30 20l20 20-20 20M20 40h30" stroke={T} strokeWidth="4" fill="none" />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {art}
    </svg>
  );
}
