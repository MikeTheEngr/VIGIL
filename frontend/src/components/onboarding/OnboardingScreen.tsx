'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api'

const DEMO_EQUIPMENT = [
  { name: 'Turbine-01',   type: 'turbine',    location: 'Plant A - Bay 1', serial_number: 'GT-001' },
  { name: 'Compressor-A', type: 'compressor', location: 'Plant A - Bay 2', serial_number: 'CP-014' },
  { name: 'Pump-03',      type: 'pump',       location: 'Plant B - Bay 1', serial_number: 'PM-031' },
]

const DEMO_PIPELINES = [
  { name: 'PL-North', segment_code: 'PL-N-001', material: 'steel', diameter_mm: 48, length_km: 12.4, location: 'North Corridor' },
  { name: 'PL-East',  segment_code: 'PL-E-002', material: 'steel', diameter_mm: 48, length_km: 9.7,  location: 'East Corridor' },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')

  const loadDemoData = async () => {
    setLoading(true)
    try {
      setStep('Creating equipment...')
      for (const eq of DEMO_EQUIPMENT) {
        await api.post('/equipment/', eq)
      }

      setStep('Creating pipelines...')
      for (const pl of DEMO_PIPELINES) {
        await api.post('/pipelines/', pl)
      }

      setStep('Done! Loading dashboard...')
      await new Promise(r => setTimeout(r, 800))
      router.refresh()
      window.location.reload()
    } catch {
      setStep('Error loading demo data. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center">

      {/* Eye pulse animation */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border border-vg-cyan opacity-20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-vg-cyan opacity-30" />
        <div className="absolute inset-4 rounded-full border border-vg-cyan opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-vg-cyan opacity-80" />
          <div className="absolute w-3 h-3 rounded-full bg-white" />
        </div>
      </div>

      {/* Status */}
      <p className="font-mono text-[10px] tracking-[6px] text-vg-cyan mb-3">
        SYSTEM READY
      </p>
      <h2 className="font-display text-3xl tracking-[4px] text-white mb-3">
        NO ASSETS DETECTED
      </h2>
      <p className="font-body text-vg-steel max-w-md mb-10 leading-relaxed">
        Vigil is online and monitoring — but no equipment or pipelines have been configured yet.
        Import your company data or load the demo to get started.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">

        {/* Primary — Import */}
        <Link
          href="/import"
          className="bg-vg-housing border border-vg-cyan/50 text-vg-cyan font-mono text-sm tracking-[3px] py-4 px-6
                     hover:bg-vg-plate hover:border-vg-cyan transition-all text-center"
        >
          + IMPORT COMPANY DATA
        </Link>

        {/* Secondary — Demo */}
        <button
          onClick={loadDemoData}
          disabled={loading}
          className="border border-vg-border-hi text-vg-steel font-mono text-sm tracking-[3px] py-4 px-6
                     hover:border-vg-cyan/40 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? step || 'LOADING...' : 'LOAD DEMO DATA'}
        </button>

        {/* Templates */}
        <Link
          href="/import#templates"
          className="font-mono text-[10px] tracking-[3px] text-vg-steel-dim hover:text-vg-cyan transition-colors mt-2"
        >
          DOWNLOAD CSV TEMPLATES →
        </Link>
      </div>

      {/* Bottom hint */}
      <p className="font-mono text-[9px] tracking-[3px] text-vg-label mt-12">
        SN-VGL-001 · AWAITING ASSET CONFIGURATION
      </p>
    </div>
  )
}
