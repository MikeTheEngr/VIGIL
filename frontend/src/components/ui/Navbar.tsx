'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const LINKS = [
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/equipment',  label: 'EQUIPMENT' },
  { href: '/pipelines',  label: 'PIPELINES' },
  { href: '/alerts',     label: 'ALERTS' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [alertCount, setAlertCount] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/alerts/count')
        setAlertCount(res.data.total)
      } catch {
        setAlertCount(null)
      }
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="border-b border-vg-border-hi bg-vg-hull sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          {/* Vigil mechanical eye mark */}
          <svg width="36" height="26" viewBox="0 0 400 296" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="nb-pgr" cx="42%" cy="38%" r="55%">
                <stop offset="0%" stopColor="#E8FAFF"/>
                <stop offset="40%" stopColor="#0098B8"/>
                <stop offset="100%" stopColor="#000E18"/>
              </radialGradient>
              <linearGradient id="nb-swg" x1="200" y1="148" x2="228" y2="148" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00D8F8" stopOpacity="1"/>
                <stop offset="100%" stopColor="#00D8F8" stopOpacity="0"/>
              </linearGradient>
              <clipPath id="nb-iris"><circle cx="200" cy="148" r="88"/></clipPath>
              <clipPath id="nb-pupil"><circle cx="200" cy="148" r="28"/></clipPath>
              <style>{`
                @keyframes nb-cw  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes nb-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
                .nb-g1 { transform-origin:200px 148px; animation:nb-cw 28s linear infinite; }
                .nb-g2 { transform-origin:200px 148px; animation:nb-ccw 18s linear infinite; }
                .nb-g3 { transform-origin:200px 148px; animation:nb-cw 10s linear infinite; }
                .nb-sw { transform-origin:200px 148px; animation:nb-cw 4s linear infinite; }
              `}</style>
            </defs>

            {/* Housing */}
            <path
              d="M36,148 L66,84 L102,58 L156,40 L200,36 L244,40 L298,58 L334,84 L364,148 L334,212 L298,238 L244,256 L200,260 L156,256 L102,238 L66,212 Z"
              fill="#0A1828" stroke="#2A5060" strokeWidth="3"
            />
            {/* Bolts */}
            {[[102,58],[200,36],[298,58],[334,84],[364,148],[334,212],[298,238],[200,260],[102,238],[66,212],[36,148],[66,84]].map(([cx,cy],i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="6" fill="#060A10" stroke="#2A5060" strokeWidth="1.5"/>
                <circle cx={cx} cy={cy} r="2.5" fill="#00B8D0" opacity="0.7"/>
              </g>
            ))}

            {/* Lens */}
            <path d="M55,148 Q120,60 200,52 Q280,60 345,148 Q280,236 200,244 Q120,236 55,148Z" fill="#02060C"/>
            <path d="M55,148 Q120,60 200,52 Q280,60 345,148 Q280,236 200,244 Q120,236 55,148Z" fill="none" stroke="#1A4A5A" strokeWidth="2"/>

            {/* Gear ring 1 */}
            <g className="nb-g1" clipPath="url(#nb-iris)">
              <circle cx="200" cy="148" r="88" fill="none" stroke="#2A5A6A" strokeWidth="9" strokeDasharray="5.5 12.87"/>
              <circle cx="200" cy="148" r="93" fill="none" stroke="#1A4A5A" strokeWidth="1.5"/>
            </g>
            {/* Gear ring 2 */}
            <g className="nb-g2" clipPath="url(#nb-iris)">
              <circle cx="200" cy="148" r="65" fill="none" stroke="#1E4A5A" strokeWidth="7" strokeDasharray="5 12.07"/>
              <circle cx="200" cy="148" r="69" fill="none" stroke="#1A3A48" strokeWidth="1"/>
            </g>
            {/* Gear ring 3 */}
            <g className="nb-g3" clipPath="url(#nb-iris)">
              <circle cx="200" cy="148" r="44" fill="none" stroke="#163848" strokeWidth="5" strokeDasharray="5 13.62"/>
            </g>

            <circle cx="200" cy="148" r="37" fill="#02060C" clipPath="url(#nb-iris)"/>

            {/* Radar sweep inside pupil */}
            <g clipPath="url(#nb-pupil)">
              <g className="nb-sw">
                <path d="M200 148 L228 148 A28 28 0 0 0 214 123.8 Z" fill="url(#nb-swg)" opacity="0.8"/>
                <line x1="200" y1="148" x2="228" y2="148" stroke="#00D8F8" strokeWidth="1.5"/>
              </g>
            </g>

            {/* Pupil lens */}
            <polygon points="200,132 214,140 214,156 200,164 186,156 186,140" fill="#020810" stroke="#1A4A5A" strokeWidth="1.5"/>
            <circle cx="200" cy="148" r="16" fill="url(#nb-pgr)" stroke="#30A0B8" strokeWidth="1.5"/>
            <ellipse cx="194" cy="142" rx="3.5" ry="2.5" fill="#C0EEFF" opacity="0.7"/>
            <circle cx="200" cy="148" r="4" fill="#F0FCFF"/>
            <circle cx="200" cy="148" r="1.5" fill="#FFFFFF"/>
          </svg>
          <span className="font-display text-xl tracking-[6px] text-white">VIGIL</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-[11px] tracking-[2px] transition-colors ${
                pathname?.startsWith(link.href)
                  ? 'text-vg-cyan'
                  : 'text-vg-steel hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {alertCount !== null && alertCount > 0 && (
            <Link
              href="/alerts"
              className="font-mono text-[11px] tracking-[1px] text-vg-warning border border-vg-warning/50 px-2.5 py-1 hover:bg-vg-warning/10 transition-colors"
            >
              [!{alertCount}]
            </Link>
          )}
          <span className="hidden sm:block font-mono text-[10px] tracking-[2px] text-vg-steel">OPERATOR</span>
          <Link
            href="/"
            className="font-mono text-[10px] tracking-[2px] text-vg-steel-dim border border-vg-border px-3 py-1.5 hover:border-vg-critical/50 hover:text-vg-critical transition-colors"
          >
            LOGOUT
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`block w-5 h-0.5 bg-vg-steel transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-vg-steel transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-vg-steel transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-vg-border bg-vg-hull px-4 py-3 space-y-1">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block font-mono text-[11px] tracking-[2px] py-2.5 border-b border-vg-border transition-colors ${
                pathname?.startsWith(link.href)
                  ? 'text-vg-cyan'
                  : 'text-vg-steel hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block font-mono text-[11px] tracking-[2px] py-2.5 text-vg-steel-dim hover:text-vg-critical transition-colors"
          >
            LOGOUT
          </Link>
        </div>
      )}
    </nav>
  )
}
