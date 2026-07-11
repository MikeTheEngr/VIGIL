'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import StatCard from '@/components/ui/StatCard'
import SectionLabel from '@/components/ui/SectionLabel'
import LiveClock from '@/components/ui/LiveClock'
import EquipmentTable from '@/components/equipment/EquipmentTable'
import PipelineTable from '@/components/pipeline/PipelineTable'
import AlertFeed from '@/components/alerts/AlertFeed'
import { api } from '@/lib/api'
import { Equipment, Pipeline, Alert, EquipmentSummary, PipelineSummary, AlertCount } from '@/lib/types'

export default function DashboardPage() {
  const [equipmentSummary, setEquipmentSummary] = useState<EquipmentSummary | null>(null)
  const [pipelineSummary,  setPipelineSummary]  = useState<PipelineSummary | null>(null)
  const [alertCount,       setAlertCount]       = useState<AlertCount | null>(null)
  const [equipment,        setEquipment]        = useState<Equipment[]>([])
  const [pipelines,        setPipelines]        = useState<Pipeline[]>([])
  const [alerts,           setAlerts]           = useState<Alert[]>([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [eqSum, plSum, alCount, eq, pl, al] = await Promise.all([
          api.get('/equipment/summary'),
          api.get('/pipelines/summary'),
          api.get('/alerts/count'),
          api.get('/equipment?limit=10'),
          api.get('/pipelines'),
          api.get('/alerts?resolved=false&limit=5'),
        ])
        setEquipmentSummary(eqSum.data)
        setPipelineSummary(plSum.data)
        setAlertCount(alCount.data)
        setEquipment(eq.data)
        setPipelines(pl.data)
        setAlerts(al.data)
        setError(false)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Status bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <SectionLabel>SYSTEM STATUS</SectionLabel>
          <LiveClock />
        </div>

        {error && (
          <div className="border border-vg-critical/40 bg-vg-critical/10 px-4 py-3 font-mono text-xs text-vg-critical">
            CONNECTION TO BACKEND FAILED — check API server is running
          </div>
        )}

        {/* Stat cards — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="EQUIPMENT" value={equipmentSummary?.total} />
          <StatCard label="PIPELINES" value={pipelineSummary?.total} />
          <StatCard label="CRITICAL"  value={alertCount?.critical} variant="critical" />
          <StatCard label="WARNINGS"  value={alertCount?.warning}  variant="warning" />
        </div>

        {/* Equipment */}
        <div className="space-y-3 sm:space-y-4">
          <SectionLabel>EQUIPMENT HEALTH</SectionLabel>
          {loading ? <Skeleton /> : <EquipmentTable data={equipment} />}
        </div>

        {/* Pipelines */}
        <div className="space-y-3 sm:space-y-4">
          <SectionLabel>PIPELINE STATUS</SectionLabel>
          {loading ? <Skeleton /> : <PipelineTable data={pipelines} />}
        </div>

        {/* Alerts */}
        <div className="space-y-3 sm:space-y-4">
          <SectionLabel>ACTIVE ALERTS</SectionLabel>
          {loading ? <Skeleton /> : <AlertFeed alerts={alerts} />}
        </div>

      </main>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="border border-vg-border bg-vg-hull h-28 flex items-center justify-center">
      <span className="font-mono text-xs text-vg-label tracking-widest animate-pulse">LOADING...</span>
    </div>
  )
}
