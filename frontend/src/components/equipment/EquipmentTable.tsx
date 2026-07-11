import Link from 'next/link'
import { Equipment } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

function healthRisk(score: number | null): string {
  if (score === null) return 'nominal'
  if (score < 30) return 'critical'
  if (score < 60) return 'warning'
  return 'nominal'
}

function healthColor(score: number | null): string {
  const risk = healthRisk(score)
  return risk === 'critical' ? '#FF1A1A' : risk === 'warning' ? '#FF8C00' : '#00B8D0'
}

export default function EquipmentTable({ data }: { data: Equipment[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-vg-border bg-vg-hull px-4 py-8 text-center">
        <p className="font-mono text-xs text-vg-steel-dim">NO EQUIPMENT REGISTERED</p>
      </div>
    )
  }

  return (
    <div className="border border-vg-border overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vg-border bg-vg-hull">
              {['NAME', 'TYPE', 'HEALTH', 'RUL', 'STATUS'].map(h => (
                <th key={h} className="text-left px-5 py-4 font-mono text-[11px] tracking-[2px] text-vg-steel font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(eq => (
              <tr key={eq.id} className="border-b border-vg-border last:border-0 hover:bg-vg-housing/30 transition-colors">
                <td className="px-5 py-4">
                  <Link href={`/equipment/${eq.id}`} className="text-white font-semibold hover:text-vg-cyan transition-colors">
                    {eq.name}
                  </Link>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-vg-steel capitalize">{eq.type}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-vg-border overflow-hidden rounded-sm">
                      <div
                        className="h-full rounded-sm"
                        style={{ width: `${eq.health_score ?? 0}%`, backgroundColor: healthColor(eq.health_score) }}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color: healthColor(eq.health_score) }}>
                      {eq.health_score?.toFixed(0) ?? '—'}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-vg-steel font-semibold">
                  {eq.rul_days !== null ? `${eq.rul_days} days` : '—'}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={healthRisk(eq.health_score)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-vg-border">
        {data.map(eq => (
          <div key={eq.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Link href={`/equipment/${eq.id}`} className="text-white font-semibold hover:text-vg-cyan">
                {eq.name}
              </Link>
              <StatusBadge status={healthRisk(eq.health_score)} />
            </div>
            <p className="font-mono text-xs text-vg-steel capitalize">{eq.type}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-vg-border overflow-hidden rounded-sm">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${eq.health_score ?? 0}%`, backgroundColor: healthColor(eq.health_score) }}
                />
              </div>
              <span className="font-mono text-sm font-bold w-12 text-right" style={{ color: healthColor(eq.health_score) }}>
                {eq.health_score?.toFixed(0) ?? '—'}%
              </span>
            </div>
            <div className="flex justify-between font-mono text-xs text-vg-steel">
              <span>RUL</span>
              <span className="font-semibold text-white">{eq.rul_days !== null ? `${eq.rul_days} days` : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
