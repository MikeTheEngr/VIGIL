interface StatCardProps {
  label: string
  value: number | string | undefined
  variant?: 'default' | 'critical' | 'warning'
}

const VARIANT_COLOR: Record<string, string> = {
  default:  '#00B8D0',
  critical: '#FF1A1A',
  warning:  '#FF8C00',
}

export default function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const color = VARIANT_COLOR[variant]

  return (
    <div className="bg-vg-hull border border-vg-border p-5 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: color, opacity: 0.7 }} />
      <span className="font-mono text-[10px] tracking-[3px] text-vg-steel uppercase font-semibold">{label}</span>
      <span className="font-display text-5xl tracking-wide font-bold" style={{ color }}>
        {value ?? '—'}
      </span>
    </div>
  )
}
