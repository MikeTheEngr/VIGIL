'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { api } from '@/lib/api'
import { Pipeline } from '@/lib/types'

export default function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [pl, pred] = await Promise.all([
          api.get(`/pipelines/${id}`),
          api.get(`/predictions/pipeline/${id}`),
        ])
        setPipeline(pl.data)
        setPrediction(pred.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <span className="font-mono text-xs text-vg-label tracking-widest animate-pulse">LOADING...</span>
        </main>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <span className="font-mono text-xs text-vg-critical">PIPELINE NOT FOUND</span>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <Link href="/pipelines" className="font-mono text-[10px] tracking-[2px] text-vg-steel-dim hover:text-vg-cyan">
          ← BACK TO PIPELINES
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl tracking-[4px] text-vg-steel">{pipeline.name.toUpperCase()}</h1>
            <p className="font-mono text-xs text-vg-steel-dim mt-1">
              {pipeline.material} · {pipeline.diameter_mm}mm · {pipeline.length_km}km · {pipeline.location ?? 'Location unknown'}
            </p>
          </div>
          <StatusBadge status={pipeline.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="ANOMALY SCORE"
            value={prediction?.anomaly_score?.toFixed(2) ?? '—'}
            variant={prediction?.anomaly_score > 0.65 ? 'critical' : 'default'}
          />
          <StatCard label="ANOMALY DETECTED" value={prediction?.is_anomaly ? 'YES' : 'NO'} />
          <StatCard
            label="LAST DETECTION"
            value={prediction?.time ? new Date(prediction.time).toLocaleTimeString('en-GB', { hour12: false }) : '—'}
          />
        </div>

        <div className="space-y-4">
          <SectionLabel>PIPELINE SEGMENT INFO</SectionLabel>
          <div className="border border-vg-border bg-vg-hull p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div><span className="text-vg-label">SEGMENT CODE</span><p className="text-vg-steel mt-1">{pipeline.segment_code}</p></div>
            <div><span className="text-vg-label">MATERIAL</span><p className="text-vg-steel mt-1 capitalize">{pipeline.material}</p></div>
            <div><span className="text-vg-label">DIAMETER</span><p className="text-vg-steel mt-1">{pipeline.diameter_mm}mm</p></div>
            <div><span className="text-vg-label">LENGTH</span><p className="text-vg-steel mt-1">{pipeline.length_km}km</p></div>
          </div>
        </div>

      </main>
    </div>
  )
}
