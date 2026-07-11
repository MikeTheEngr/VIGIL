'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import HealthTrendChart from '@/components/charts/HealthTrendChart'
import AlertFeed from '@/components/alerts/AlertFeed'
import { api } from '@/lib/api'
import { Equipment, Alert } from '@/lib/types'

function healthRisk(score: number | null): string {
  if (score === null) return 'nominal'
  if (score < 30) return 'critical'
  if (score < 60) return 'warning'
  return 'nominal'
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [eq, hist, al] = await Promise.all([
          api.get(`/equipment/${id}`),
          api.get(`/predictions/equipment/${id}/history?days=30`),
          api.get(`/alerts?resolved=false&limit=10`),
        ])
        setEquipment(eq.data)
        setHistory(hist.data.history)
        setAlerts(al.data.filter((a: Alert) => a.equipment_id === id))
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

  if (!equipment) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <span className="font-mono text-xs text-vg-critical">EQUIPMENT NOT FOUND</span>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <Link href="/equipment" className="font-mono text-[10px] tracking-[2px] text-vg-steel-dim hover:text-vg-cyan">
          ← BACK TO EQUIPMENT
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl tracking-[4px] text-vg-steel">{equipment.name.toUpperCase()}</h1>
            <p className="font-mono text-xs text-vg-steel-dim mt-1">
              {equipment.type} · {equipment.location ?? 'Location unknown'} · SN: {equipment.serial_number ?? '—'}
            </p>
          </div>
          <StatusBadge status={healthRisk(equipment.health_score)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="HEALTH SCORE" value={equipment.health_score ? `${equipment.health_score.toFixed(0)}%` : '—'} />
          <StatCard label="RUL" value={equipment.rul_days ? `${equipment.rul_days} days` : '—'} />
          <StatCard label="LAST UPDATED" value={new Date(equipment.updated_at).toLocaleTimeString('en-GB', { hour12: false })} />
        </div>

        <div className="space-y-4">
          <SectionLabel>HEALTH SCORE TREND — LAST 30 DAYS</SectionLabel>
          <HealthTrendChart data={history} />
        </div>

        <div className="space-y-4">
          <SectionLabel>ALERT HISTORY</SectionLabel>
          <AlertFeed alerts={alerts} compact />
        </div>

      </main>
    </div>
  )
}
