'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HistoryPoint {
  time: string
  health_score: number | null
  rul_days: number | null
}

export default function HealthTrendChart({ data }: { data: HistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-vg-border bg-vg-hull h-64 flex items-center justify-center">
        <span className="font-mono text-xs text-vg-label tracking-widest">NO HISTORY DATA YET</span>
      </div>
    )
  }

  const chartData = data.map(d => ({
    time: new Date(d.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    health: d.health_score,
  }))

  return (
    <div className="border border-vg-border bg-vg-hull p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="2 4" stroke="#0E2030" />
          <XAxis dataKey="time" stroke="#1E4A5A" tick={{ fontSize: 10, fontFamily: 'Share Tech Mono' }} />
          <YAxis domain={[0, 100]} stroke="#1E4A5A" tick={{ fontSize: 10, fontFamily: 'Share Tech Mono' }} />
          <Tooltip
            contentStyle={{ background: '#080C14', border: '1px solid #1A3A4A', fontFamily: 'Share Tech Mono', fontSize: 11 }}
            labelStyle={{ color: '#B8CCD4' }}
          />
          <Line type="monotone" dataKey="health" stroke="#00B8D0" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
