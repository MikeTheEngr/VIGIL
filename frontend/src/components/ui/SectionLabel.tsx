export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] tracking-[4px] text-vg-cyan uppercase font-semibold">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-vg-border-hi to-transparent" />
    </div>
  )
}
