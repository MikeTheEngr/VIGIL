'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import EquipmentTable from '@/components/equipment/EquipmentTable'
import { api } from '@/lib/api'
import { Equipment } from '@/lib/types'

export default function EquipmentListPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/equipment?limit=100')
      .then(res => setEquipment(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <SectionLabel>ALL EQUIPMENT</SectionLabel>
        {loading ? (
          <div className="border border-vg-border bg-vg-hull h-32 flex items-center justify-center">
            <span className="font-mono text-xs text-vg-label tracking-widest animate-pulse">LOADING...</span>
          </div>
        ) : (
          <EquipmentTable data={equipment} />
        )}
      </main>
    </div>
  )
}
