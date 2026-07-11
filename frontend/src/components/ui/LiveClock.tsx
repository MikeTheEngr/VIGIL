'use client'

import { useEffect, useState } from 'react'

export default function LiveClock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-vg-steel-dim tracking-widest">
      <span className="w-1.5 h-1.5 rounded-full bg-vg-cyan animate-pulse" />
      {time || '--:--:--'} · LIVE
    </div>
  )
}
