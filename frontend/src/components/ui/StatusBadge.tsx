const VARIANTS: Record<string, { color: string; bg: string; border: string }> = {
  nominal:  { color: '#00B8D0', bg: '#00B8D015', border: '#00B8D040' },
  watch:    { color: '#3A8A6A', bg: '#3A8A6A15', border: '#3A8A6A40' },
  warning:  { color: '#FF8C00', bg: '#FF8C0015', border: '#FF8C0040' },
  critical: { color: '#FF1A1A', bg: '#FF1A1A15', border: '#FF1A1A40' },
  normal:   { color: '#00B8D0', bg: '#00B8D015', border: '#00B8D040' },
  active:   { color: '#00B8D0', bg: '#00B8D015', border: '#00B8D040' },
}

export default function StatusBadge({ status }: { status: string }) {
  const v = VARIANTS[status.toLowerCase()] ?? VARIANTS.nominal

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] tracking-[2px] uppercase"
      style={{ color: v.color, backgroundColor: v.bg, border: `1px solid ${v.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color }} />
      {status}
    </span>
  )
}
