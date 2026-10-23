import { useState } from 'react';
import ApplianceIcon from './ApplianceIcon';
import { useArea } from '../context/AreaContext';

/**
 * Right side of the hero. Shows /images/hero-banner.png (technician + appliances photo).
 * If that file is missing, an illustrated appliance group is shown instead.
 */
export default function HeroArt() {
  const [photoOk, setPhotoOk] = useState(true);
  const { area } = useArea();

  if (photoOk) {
    return (
      <div className="qf-hero-art has-photo">
        <img
          src="/images/hero-banner.png"
          alt="QuickFix Home technician with AC, fridge, washing machine, geyser, microwave and mixer grinder"
          className="hero-banner"
          onError={() => setPhotoOk(false)}
        />
        <div className="qf-hero-badge" aria-hidden="true">
          Service in {area} &amp; Nearby Areas
        </div>
      </div>
    );
  }

  return (
    <div className="qf-hero-art" aria-hidden="true">
      <div className="qf-hero-glow" />
      <div className="qf-hero-script">
        We Fix It...
        <br />
        You Relax...
      </div>
      <div className="position-absolute bottom-0 start-50 translate-middle-x d-flex align-items-end gap-2 pb-2">
        <div className="bg-white rounded-4 p-2 shadow"><ApplianceIcon slug="fridge-repair" size={150} /></div>
        <div className="d-flex flex-column gap-2">
          <div className="bg-white rounded-4 p-2 shadow"><ApplianceIcon slug="ac-repair" size={120} /></div>
          <div className="bg-white rounded-4 p-2 shadow"><ApplianceIcon slug="washing-machine-repair" size={120} /></div>
        </div>
      </div>
      <div className="qf-hero-badge">
        Service in {area} &amp; Nearby Areas
      </div>
    </div>
  );
}
