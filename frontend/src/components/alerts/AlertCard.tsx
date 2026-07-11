import Link from 'next/link'
import { Alert } from '@/lib/types'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#FF1A1A',
  warning: '#FF8C00',
  info: '#00B8D0',
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

interface AlertCardProps {
  alert: Alert
  onAcknowledge: () => void
  onResolve: () => void
}

export default function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const color = SEVERITY_COLOR[alert.severity]
  const linkHref = alert.equipment_id
    ? `/equipment/${alert.equipment_id}`
    : alert.pipeline_id
    ? `/pipelines/${alert.pipeline_id}`
    : null

  return (
    <div className="border border-vg-border bg-vg-hull p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color }}>
            {alert.severity}
          </span>
          {alert.is_acknowledged && (
            <span className="font-mono text-[9px] tracking-[1px] text-vg-steel-dim border border-vg-border px-1.5 py-0.5">
              ACKNOWLEDGED
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-vg-steel-dim">{timeAgo(alert.time)}</span>
      </div>

      <div>
        <p className="text-sm text-vg-steel">{alert.title}</p>
        {alert.message && <p className="text-xs text-vg-steel-dim mt-1">{alert.message}</p>}
      </div>

      <div className="flex items-center gap-3 pt-1">
        {!alert.is_acknowledged && (
          <button
            onClick={onAcknowledge}
            className="font-mono text-[10px] tracking-[1px] text-vg-steel border border-vg-border px-3 py-1.5 hover:border-vg-border-hi transition-colors"
          >
            ACKNOWLEDGE
          </button>
        )}
        <button
          onClick={onResolve}
          className="font-mono text-[10px] tracking-[1px] text-vg-cyan border border-vg-cyan/40 px-3 py-1.5 hover:border-vg-cyan transition-colors"
        >
          RESOLVE
        </button>
        {linkHref && (
          <Link href={linkHref} className="font-mono text-[10px] tracking-[1px] text-vg-steel-dim hover:text-vg-cyan ml-auto">
            VIEW →
          </Link>
        )}
      </div>
    </div>
  )
}
