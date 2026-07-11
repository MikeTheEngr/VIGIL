'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VigilLogo from '@/components/ui/VigilLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Auth wiring goes here once an auth provider is chosen.
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <VigilLogo size={160} />

      <div className="flex flex-col items-center gap-1">
        <h1 className="font-display text-6xl tracking-[20px] text-vg-steel pl-5">VIGIL</h1>
        <p className="font-mono text-[10px] tracking-[6px] text-vg-cyan-dim">PREDICTIVE INTELLIGENCE</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          required
          placeholder="OPERATOR ID"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-vg-hull border border-vg-border text-vg-steel font-mono text-sm px-4 py-3 tracking-widest
                     focus:outline-none focus:border-vg-border-hi placeholder:text-vg-label"
        />
        <input
          type="password"
          required
          placeholder="ACCESS CODE"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-vg-hull border border-vg-border text-vg-steel font-mono text-sm px-4 py-3 tracking-widest
                     focus:outline-none focus:border-vg-border-hi placeholder:text-vg-label"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-vg-housing border border-vg-border-hi text-vg-cyan font-mono text-sm tracking-[6px] py-3 mt-2
                     hover:bg-vg-plate hover:border-vg-cyan transition-all duration-200 disabled:opacity-40"
        >
          {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
        </button>
      </form>

      <p className="font-mono text-[8px] tracking-[4px] text-vg-label">SN-VGL-001 · OPTICAL SENSOR UNIT</p>
    </main>
  )
}
