'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import AlertCard from '@/components/alerts/AlertCard'
import { api } from '@/lib/api'
import { Alert, Severity } from '@/lib/types'

type SeverityFilter = 'all' | Severity

const SEVERITIES: SeverityFilter[] = ['all', 'critical', 'warning', 'info']

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [resolved, setResolved] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (severity !== 'all') params.set('severity', severity)
    params.set('resolved', String(resolved))
    const res = await api.get(`/alerts?${params}`)
    setAlerts(res.data)
    setLoading(false)
  }, [severity, resolved])

  useEffect(() => { load() }, [load])

  const acknowledge = async (id: string) => {
    await api.patch(`/alerts/${id}/acknowledge`)
    load()
  }

  const resolve = async (id: string) => {
    await api.patch(`/alerts/${id}/resolve`)
    load()
  }

  const clearResolved = async () => {
    await api.delete('/alerts/resolved')
    load()
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <SectionLabel>ALERT MANAGEMENT</SectionLabel>
          <button
            onClick={clearResolved}
            className="font-mono text-[10px] tracking-[2px] text-vg-steel-dim border border-vg-border px-4 py-2 hover:border-vg-border-hi hover:text-vg-steel transition-all shrink-0"
          >
            CLEAR RESOLVED
          </button>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`font-mono text-[10px] tracking-[2px] px-3 py-1.5 border transition-colors ${
                severity === s
                  ? 'text-vg-cyan border-vg-cyan/50 bg-vg-cyan/10'
                  : 'text-vg-steel-dim border-vg-border hover:border-vg-border-hi'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setResolved(!resolved)}
            className="font-mono text-[10px] tracking-[2px] px-3 py-1.5 border border-vg-border text-vg-steel-dim hover:border-vg-border-hi ml-auto"
          >
            {resolved ? 'SHOWING: RESOLVED' : 'SHOWING: UNRESOLVED'}
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <span className="font-mono text-xs text-vg-label tracking-widest animate-pulse">LOADING...</span>
          ) : alerts.length === 0 ? (
            <div className="border border-vg-border bg-vg-hull px-4 py-8 text-center">
              <span className="font-mono text-xs text-vg-steel-dim tracking-wide">NO ALERTS MATCH CURRENT FILTERS</span>
            </div>
          ) : (
            alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledge(alert.id)}
                onResolve={() => resolve(alert.id)}
              />
            ))
          )}
        </div>

      </main>
    </div>
  )
}
