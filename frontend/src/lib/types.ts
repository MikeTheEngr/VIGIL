export type RiskLevel = 'nominal' | 'watch' | 'warning' | 'critical'
export type Severity  = 'info' | 'warning' | 'critical'

export interface Equipment {
  id: string
  name: string
  type: string
  location: string | null
  serial_number: string | null
  status: string
  health_score: number | null
  rul_days: number | null
  updated_at: string
}

export interface Pipeline {
  id: string
  name: string
  segment_code: string | null
  material: string | null
  diameter_mm: number | null
  length_km: number | null
  location: string | null
  status: string
  updated_at: string
}

export interface Sensor {
  id: string
  name: string
  type: string
  unit: string | null
  equipment_id: string | null
  pipeline_id: string | null
  is_active: boolean
}

export interface SensorReading {
  time: string
  value: number
  quality: string
}

export interface Alert {
  id: string
  time: string
  severity: Severity
  type: string
  title: string
  message: string | null
  equipment_id: string | null
  pipeline_id: string | null
  is_acknowledged: boolean
  resolved: boolean
}

export interface EquipmentSummary {
  total: number
  critical: number
  warning: number
  nominal: number
}

export interface PipelineSummary {
  total: number
  critical: number
  warning: number
  normal: number
}

export interface AlertCount {
  total: number
  critical: number
  warning: number
}
