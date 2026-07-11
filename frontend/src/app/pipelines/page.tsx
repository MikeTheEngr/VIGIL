'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import PipelineTable from '@/components/pipeline/PipelineTable'
import { api } from '@/lib/api'
import { Pipeline } from '@/lib/types'

export default function PipelineListPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pipelines?limit=100')
      .then(res => setPipelines(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <SectionLabel>ALL PIPELINES</SectionLabel>
        {loading ? (
          <div className="border border-vg-border bg-vg-hull h-32 flex items-center justify-center">
            <span className="font-mono text-xs text-vg-label tracking-widest animate-pulse">LOADING...</span>
          </div>
        ) : (
          <PipelineTable data={pipelines} />
        )}
      </main>
    </div>
  )
}
