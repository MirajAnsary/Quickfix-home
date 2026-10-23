import { useState } from 'react';
import ApplianceIcon from './ApplianceIcon';

/** Photo from /images/services/<slug>.png, falling back to the line illustration if missing. */
export default function ServiceImage({ slug, alt = '', height = 86 }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <ApplianceIcon slug={slug} size={Math.round(height * 0.9)} />;
  return (
    <img
      src={`/images/services/${slug}.png`}
      alt={alt}
      className="service-photo"
      style={{ maxHeight: height }}
      loading="lazy"
      onError={() => setOk(false)}
    />
  );
}
