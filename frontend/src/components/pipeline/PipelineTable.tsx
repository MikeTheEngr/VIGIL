import Link from 'next/link'
import { Pipeline } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

export default function PipelineTable({ data }: { data: Pipeline[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-vg-border bg-vg-hull px-4 py-8 text-center">
        <p className="font-mono text-xs text-vg-steel-dim">NO PIPELINES REGISTERED</p>
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
              {['SEGMENT', 'MATERIAL', 'LENGTH', 'LOCATION', 'STATUS'].map(h => (
                <th key={h} className="text-left px-5 py-4 font-mono text-[11px] tracking-[2px] text-vg-steel font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(pl => (
              <tr key={pl.id} className="border-b border-vg-border last:border-0 hover:bg-vg-housing/30 transition-colors">
                <td className="px-5 py-4">
                  <Link href={`/pipelines/${pl.id}`} className="text-white font-semibold hover:text-vg-cyan transition-colors">
                    {pl.name}
                  </Link>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-vg-steel capitalize">{pl.material ?? '—'}</td>
                <td className="px-5 py-4 font-mono text-sm text-vg-steel">{pl.length_km ? `${pl.length_km} km` : '—'}</td>
                <td className="px-5 py-4 font-mono text-sm text-vg-steel">{pl.location ?? '—'}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={pl.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-vg-border">
        {data.map(pl => (
          <div key={pl.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Link href={`/pipelines/${pl.id}`} className="text-white font-semibold hover:text-vg-cyan">
                {pl.name}
              </Link>
              <StatusBadge status={pl.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div>
                <span className="text-vg-steel-dim">MATERIAL</span>
                <p className="text-vg-steel mt-0.5 capitalize">{pl.material ?? '—'}</p>
              </div>
              <div>
                <span className="text-vg-steel-dim">LENGTH</span>
                <p className="text-vg-steel mt-0.5">{pl.length_km ? `${pl.length_km} km` : '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-vg-steel-dim">LOCATION</span>
                <p className="text-vg-steel mt-0.5">{pl.location ?? '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
