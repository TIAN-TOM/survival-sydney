import { useEffect, useRef } from 'react';

/**
 * Sydney sky / harbour skyline layer from sydney-quiz-prototype (no mascot).
 * usePhotoBackdrop: when true (non–gate/start quiz flow), full-bleed day/night photos replace the parchment-style sky.
 */
export default function SydneyBackground({ usePhotoBackdrop = false }: { usePhotoBackdrop?: boolean }) {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = starsRef.current;
    if (!host) return;
    host.innerHTML = '';
    for (let i = 0; i < 120; i += 1) {
      const s = document.createElement('div');
      s.className = 'sq-star';
      const sz = Math.random() * 2.5 + 0.5;
      Object.assign(s.style, {
        width: `${sz}px`,
        height: `${sz}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 70}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${1.5 + Math.random() * 2}s`,
      });
      host.appendChild(s);
    }
  }, []);

  return (
    <div
      className={`sq-world-bg${usePhotoBackdrop ? ' sq-world-bg--photo' : ''}`}
      aria-hidden="true"
    >
      <div className="sq-cloud" style={{ top: '12%', left: '8%' }}>
        <div className="sq-cloud-shape" style={{ width: '80px', height: '24px', position: 'absolute' }} />
        <div
          className="sq-cloud-shape"
          style={{ width: '50px', height: '34px', position: 'absolute', top: '-14px', left: '12px' }}
        />
        <div
          className="sq-cloud-shape"
          style={{ width: '40px', height: '26px', position: 'absolute', top: '-8px', left: '35px' }}
        />
      </div>
      <div className="sq-cloud" style={{ top: '8%', right: '15%' }}>
        <div className="sq-cloud-shape" style={{ width: '100px', height: '28px', position: 'absolute' }} />
        <div
          className="sq-cloud-shape"
          style={{ width: '60px', height: '38px', position: 'absolute', top: '-16px', left: '18px' }}
        />
        <div
          className="sq-cloud-shape"
          style={{ width: '45px', height: '28px', position: 'absolute', top: '-10px', left: '48px' }}
        />
      </div>
      <div className="sq-cloud" style={{ top: '20%', left: '40%' }}>
        <div className="sq-cloud-shape" style={{ width: '70px', height: '20px', position: 'absolute' }} />
        <div
          className="sq-cloud-shape"
          style={{ width: '42px', height: '30px', position: 'absolute', top: '-12px', left: '10px' }}
        />
      </div>

      <div className="sq-stars" ref={starsRef} />
      <div className="sq-vivid" />

      <svg
        className="sq-skyline"
        viewBox="0 0 1440 220"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Sydney harbour silhouette</title>
        <rect x="0" y="160" width="1440" height="60" fill="var(--sq-water)" opacity="0.4" />

        <g fill="var(--sq-lm-col)" opacity="0.7">
          <path d="M80 160 Q200 60 320 160" stroke="var(--sq-lm-col)" strokeWidth="5" fill="none" />
          <rect x="60" y="155" width="280" height="6" rx="3" />
          <rect x="125" y="80" width="12" height="80" rx="2" />
          <rect x="263" y="80" width="12" height="80" rx="2" />
          <line x1="131" y1="88" x2="180" y2="158" stroke="var(--sq-lm-col)" strokeWidth="1" opacity="0.5" />
          <line x1="131" y1="88" x2="155" y2="158" stroke="var(--sq-lm-col)" strokeWidth="1" opacity="0.5" />
          <line x1="269" y1="88" x2="260" y2="158" stroke="var(--sq-lm-col)" strokeWidth="1" opacity="0.5" />
          <line x1="269" y1="88" x2="285" y2="158" stroke="var(--sq-lm-col)" strokeWidth="1" opacity="0.5" />
        </g>

        <g fill="var(--sq-lm-col)" opacity="0.7">
          <rect x="720" y="148" width="160" height="14" rx="4" />
          <path d="M740 148 Q752 110 768 148" />
          <path d="M755 148 Q772 90 792 148" />
          <path d="M775 148 Q800 75 825 148" />
          <path d="M815 148 Q828 105 843 148" />
        </g>

        <g fill="var(--sq-lm-col)" opacity="0.55">
          <circle cx="1340" cy="135" r="28" />
          <circle cx="1340" cy="135" r="22" fill="var(--sq-sky2)" opacity="0.3" />
          <path
            d="M1326 140 Q1340 155 1354 140"
            stroke="var(--sq-lm-col)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="1330" cy="130" r="5" />
          <circle cx="1350" cy="130" r="5" />
          <rect x="1305" y="108" width="8" height="35" rx="3" />
          <rect x="1367" y="108" width="8" height="35" rx="3" />
        </g>

        <g fill="var(--sq-lm-col)" opacity="0.45">
          <rect x="950" y="90" width="22" height="72" rx="3" />
          <rect x="978" y="110" width="16" height="52" rx="3" />
          <rect x="1000" y="100" width="28" height="62" rx="3" />
          <rect x="1038" y="70" width="14" height="92" rx="2" />
          <ellipse cx="1045" cy="70" rx="20" ry="8" />
          <rect x="1042" y="40" width="6" height="35" rx="1" />
          <rect x="1060" y="115" width="20" height="47" rx="2" />
          <rect x="1086" y="105" width="18" height="57" rx="2" />
        </g>

        <path
          d="M0 165 Q360 155 720 168 Q1080 180 1440 165 L1440 220 L0 220 Z"
          fill="var(--sq-ground)"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
