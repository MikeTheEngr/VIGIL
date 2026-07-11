import { Alert } from '@/lib/types'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#FF1A1A',
  warning:  '#FF8C00',
  info:     '#00B8D0',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'CRIT',
  warning:  'WARN',
  info:     'INFO',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AlertFeed({ alerts, compact = false }: { alerts: Alert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <div className="border border-vg-border bg-vg-hull px-4 py-8 text-center">
        <span className="font-mono text-xs text-vg-steel-dim tracking-wide">NO ACTIVE ALERTS</span>
      </div>
    )
  }

  return (
    <div className="border border-vg-border divide-y divide-vg-border">
      {alerts.map(alert => {
        const color = SEVERITY_COLOR[alert.severity]
        return (
          <div key={alert.id} className="px-4 py-4 flex items-start gap-3 hover:bg-vg-housing/20 transition-colors">
            <span
              className="font-mono text-[10px] tracking-[1px] px-2 py-1 mt-0.5 shrink-0 font-bold"
              style={{ color, border: `1px solid ${color}60`, backgroundColor: `${color}15` }}
            >
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold leading-snug">{alert.title}</p>
              {!compact && alert.message && (
                <p className="text-xs text-vg-steel mt-1 leading-relaxed">{alert.message}</p>
              )}
            </div>
            <span className="font-mono text-[10px] text-vg-steel shrink-0 mt-1">
              {timeAgo(alert.time)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
