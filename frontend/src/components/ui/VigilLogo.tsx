'use client'

interface VigilLogoProps {
  size?: number
  animated?: boolean
}

export default function VigilLogo({ size = 120, animated = true }: VigilLogoProps) {
  const anim = animated ? '' : '[animation:none]'

  return (
    <svg width={size} height={size * 0.74} viewBox="0 0 400 296" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vg-hbg" cx="50%" cy="36%" r="64%">
          <stop offset="0%" stopColor="#243444" />
          <stop offset="50%" stopColor="#141E2C" />
          <stop offset="100%" stopColor="#080C14" />
        </radialGradient>
        <radialGradient id="vg-pgr" cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#E8FAFF" />
          <stop offset="18%" stopColor="#70E0F8" />
          <stop offset="45%" stopColor="#0098B8" />
          <stop offset="75%" stopColor="#004058" />
          <stop offset="100%" stopColor="#000E18" />
        </radialGradient>
        <linearGradient id="vg-swg" x1="200" y1="148" x2="228" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D8F8" stopOpacity="1" />
          <stop offset="100%" stopColor="#00D8F8" stopOpacity="0" />
        </linearGradient>
        <clipPath id="vg-iris"><circle cx="200" cy="148" r="88" /></clipPath>
        <clipPath id="vg-pupil"><circle cx="200" cy="148" r="28" /></clipPath>
        <style>{`
          @keyframes vg-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes vg-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
          .vg-g1 { transform-origin: 200px 148px; animation: vg-cw 28s linear infinite; }
          .vg-g2 { transform-origin: 200px 148px; animation: vg-ccw 18s linear infinite; }
          .vg-g3 { transform-origin: 200px 148px; animation: vg-cw 10s linear infinite; }
          .vg-sw { transform-origin: 200px 148px; animation: vg-cw 4s linear infinite; }
        `}</style>
      </defs>

      {/* Housing */}
      <path
        d="M36,148 L66,84 L102,58 L156,40 L200,36 L244,40 L298,58 L334,84 L364,148
           L334,212 L298,238 L244,256 L200,260 L156,256 L102,238 L66,212 Z"
        fill="url(#vg-hbg)" stroke="#1A3848" strokeWidth="2"
      />
      {[[102,58],[200,36],[298,58],[334,84],[364,148],[334,212],[298,238],[200,260],[102,238],[66,212],[36,148],[66,84]].map(([cx,cy],i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5.5" fill="#050A10" stroke="#243C4E" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill="#1A4050" />
        </g>
      ))}

      {/* Lens recess */}
      <path d="M55,148 Q120,60 200,52 Q280,60 345,148 Q280,236 200,244 Q120,236 55,148Z" fill="#02060C" />

      {/* Gear ring 1 — outer, CW slow */}
      <g className={`vg-g1 ${anim}`} clipPath="url(#vg-iris)">
        <circle cx="200" cy="148" r="88" fill="none" stroke="#2A4A58" strokeWidth="9" strokeDasharray="5.5 12.87" />
        <circle cx="200" cy="148" r="93" fill="none" stroke="#1A3848" strokeWidth="1" />
      </g>
      {/* Gear ring 2 — mid, CCW */}
      <g className={`vg-g2 ${anim}`} clipPath="url(#vg-iris)">
        <circle cx="200" cy="148" r="65" fill="none" stroke="#1E3848" strokeWidth="7" strokeDasharray="5 12.07" />
        <circle cx="200" cy="148" r="69" fill="none" stroke="#162C3A" strokeWidth="1" />
      </g>
      {/* Gear ring 3 — inner, CW fast */}
      <g className={`vg-g3 ${anim}`} clipPath="url(#vg-iris)">
        <circle cx="200" cy="148" r="44" fill="none" stroke="#162838" strokeWidth="5" strokeDasharray="5 13.62" />
        <circle cx="200" cy="148" r="47" fill="none" stroke="#0E2030" strokeWidth="1" />
      </g>

      <circle cx="200" cy="148" r="37" fill="#02060C" clipPath="url(#vg-iris)" />

      {/* Radar sweep — pupil only */}
      <g clipPath="url(#vg-pupil)">
        <g className={`vg-sw ${anim}`}>
          <path d="M200 148 L228 148 A28 28 0 0 0 214 123.8 Z" fill="url(#vg-swg)" opacity="0.7" />
          <line x1="200" y1="148" x2="228" y2="148" stroke="#00D8F8" strokeWidth="1.2" />
        </g>
      </g>

      {/* Pupil lens */}
      <polygon points="200,132 214,140 214,156 200,164 186,156 186,140" fill="#020810" stroke="#0C1E2C" strokeWidth="1.5" />
      <circle cx="200" cy="148" r="16" fill="url(#vg-pgr)" stroke="#2090A8" strokeWidth="1.2" />
      <circle cx="200" cy="148" r="4" fill="#F0FCFF" />

      <text x="200" y="274" textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize="6.5" fill="#1A3040" letterSpacing="3">
        OPTICAL SENSOR UNIT
      </text>
    </svg>
  )
}
