'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/ui/Navbar'
import SectionLabel from '@/components/ui/SectionLabel'
import { api } from '@/lib/api'

type ImportType = 'equipment' | 'pipelines' | 'sensors' | 'readings'

interface ImportResult {
  status: string
  inserted: number
  skipped: number
  errors: string[]
}

const IMPORT_TYPES: { key: ImportType; label: string; description: string; icon: string }[] = [
  { key: 'equipment', label: 'EQUIPMENT',  description: 'Turbines, compressors, pumps, motors'},
  { key: 'pipelines', label: 'PIPELINES',  description: 'Pipeline segments and corridors',       },
  { key: 'sensors',   label: 'SENSORS',    description: 'Sensor definitions linked to assets',    },
  { key: 'readings',  label: 'READINGS',   description: 'Historical sensor time-series data',    },
]

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[] }> = {
  equipment: {
    headers: ['name', 'type', 'location', 'serial_number', 'installed_at', 'health_score', 'rul_days'],
    example: ['Turbine-01', 'turbine', 'Plant A - Bay 1', 'GT-001', '2021-01-15', '82', '44'],
  },
  pipelines: {
    headers: ['name', 'segment_code', 'material', 'diameter_mm', 'length_km', 'location', 'installed_at'],
    example: ['PL-North', 'PL-N-001', 'steel', '48', '12.4', 'North Corridor', '2018-06-01'],
  },
  sensors: {
    headers: ['name', 'type', 'unit', 'equipment_serial_or_pipeline_code', 'min_threshold', 'max_threshold'],
    example: ['Turbine-01 Temp', 'temperature', '°C', 'GT-001', '300', '550'],
  },
  readings: {
    headers: ['sensor_name', 'time', 'value', 'quality'],
    example: ['Turbine-01 Temp', '2026-01-15T10:30:00Z', '487.3', 'good'],
  },
}

function downloadTemplate(type: ImportType) {
  const { headers, example } = TEMPLATES[type]
  const csv = [headers.join(','), example.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vigil_${type}_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function UploadZone({
  type, label, description, icon, onResult
}: {
  type: ImportType
  label: string
  description: string
  icon: string
  onResult: (type: ImportType, result: ImportResult) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setFileName(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/import/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onResult(type, res.data)
    } catch (e: any) {
      onResult(type, {
        status: 'error',
        inserted: 0,
        skipped: 0,
        errors: [e?.response?.data?.detail || 'Upload failed']
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  return (
    <div
      className={`border p-5 cursor-pointer transition-all ${
        dragging
          ? 'border-vg-cyan bg-vg-cyan/10'
          : 'border-vg-border bg-vg-hull hover:border-vg-border-hi'
      }`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />

      <div className="flex items-start gap-4">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[11px] tracking-[3px] text-vg-steel font-semibold">{label}</span>
            <button
              onClick={e => { e.stopPropagation(); downloadTemplate(type) }}
              className="font-mono text-[9px] tracking-[2px] text-vg-cyan-dim border border-vg-border px-2 py-1 hover:border-vg-cyan hover:text-vg-cyan transition-colors"
            >
              TEMPLATE ↓
            </button>
          </div>
          <p className="font-body text-xs text-vg-steel-dim mt-1">{description}</p>

          <div className="mt-3 border border-dashed border-vg-border-hi px-3 py-2 text-center">
            {uploading ? (
              <span className="font-mono text-[10px] text-vg-cyan tracking-widest animate-pulse">
                UPLOADING {fileName}...
              </span>
            ) : fileName ? (
              <span className="font-mono text-[10px] text-vg-steel tracking-widest">
                {fileName} — click to replace
              </span>
            ) : (
              <span className="font-mono text-[10px] text-vg-steel-dim tracking-widest">
                DROP CSV HERE OR CLICK TO BROWSE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ type, result }: { type: ImportType; result: ImportResult }) {
  const hasErrors = result.errors.length > 0
  const isSuccess = result.inserted > 0

  return (
    <div className={`border p-4 space-y-2 ${
      isSuccess ? 'border-vg-nominal/40 bg-vg-nominal/5' : 'border-vg-critical/40 bg-vg-critical/5'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[2px] text-white font-semibold uppercase">{type}</span>
        <span className={`font-mono text-[10px] tracking-[1px] ${isSuccess ? 'text-vg-nominal' : 'text-vg-critical'}`}>
          {isSuccess ? '✓ IMPORTED' : '✗ FAILED'}
        </span>
      </div>
      <div className="flex gap-4 font-mono text-xs">
        <span className="text-vg-nominal">↑ {result.inserted} inserted</span>
        {result.skipped > 0 && <span className="text-vg-warning">⚠ {result.skipped} skipped</span>}
      </div>
      {hasErrors && (
        <div className="space-y-1 mt-2">
          {result.errors.map((err, i) => (
            <p key={i} className="font-mono text-[10px] text-vg-critical">{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ImportPage() {
  const [results, setResults] = useState<Partial<Record<ImportType, ImportResult>>>({})

  const handleResult = (type: ImportType, result: ImportResult) => {
    setResults(prev => ({ ...prev, [type]: result }))
  }

  const hasResults = Object.keys(results).length > 0

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <SectionLabel>DATA IMPORT</SectionLabel>
          <p className="font-body text-vg-steel text-sm leading-relaxed max-w-2xl">
            Upload your company asset data in CSV format. Import in order —
            equipment and pipelines first, then sensors, then readings.
            Each import shows exactly what was accepted and what was skipped.
          </p>
        </div>

        {/* Upload zones */}
        <div id="templates" className="space-y-3">
          <SectionLabel>UPLOAD DATA</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IMPORT_TYPES.map(t => (
              <UploadZone
                key={t.key}
                type={t.key}
                label={t.label}
                description={t.description}
                icon={t.icon}
                onResult={handleResult}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="space-y-3">
            <SectionLabel>IMPORT RESULTS</SectionLabel>
            <div className="space-y-2">
              {Object.entries(results).map(([type, result]) => (
                <ResultCard key={type} type={type as ImportType} result={result!} />
              ))}
            </div>
          </div>
        )}

        {/* Format guide */}
        <div className="space-y-3">
          <SectionLabel>CSV FORMAT GUIDE</SectionLabel>
          <div className="space-y-3">
            {IMPORT_TYPES.map(t => (
              <div key={t.key} className="border border-vg-border bg-vg-hull p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-[3px] text-vg-steel font-semibold">
                    {t.label}
                  </span>
                  <button
                    onClick={() => downloadTemplate(t.key)}
                    className="font-mono text-[9px] tracking-[2px] text-vg-cyan border border-vg-cyan/30 px-2 py-1 hover:border-vg-cyan transition-colors"
                  >
                    DOWNLOAD TEMPLATE ↓
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr>
                        {TEMPLATES[t.key].headers.map(h => (
                          <th key={h} className="text-left py-1 pr-4 text-vg-cyan-dim">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {TEMPLATES[t.key].example.map((v, i) => (
                          <td key={i} className="py-1 pr-4 text-vg-steel-dim">{v}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
