// types/integrations.ts
import { ReactNode } from "react"

// types/integrations.ts
export interface CreateIntegrationData {
  name: string
  description?: string
  type: 'manual' | 'scheduled' | 'api'
  source_system: string
  target_collection_id?: string
  file_pattern: string
  schedule_cron?: string
  file_retention_days: number
  // Novos campos para tipo de upload
  upload_type: 'dataset' | 'collection' | 'fluid'
  dataset_name_pattern?: string // Ex: "Vendas_{date}" ou "Estoque_Atual"
  fluid_config?: {
    preserve_schema: boolean
    backup_previous: boolean
  }
}

export interface Integration {
  id: string
  name: string
  description: string | null
  type: 'manual' | 'scheduled' | 'api'
  status: 'active' | 'inactive' | 'error'
  source_system: string
  target_collection_id: string | null
  file_pattern: string
  schedule_cron: string | null
  api_key: string
  webhook_url: string
  file_retention_days: number
  created_at: string
  updated_at: string
  last_run_at: string | null
  next_run_at: string | null
  // Novos campos
  upload_type: 'dataset' | 'collection' | 'fluid'
  dataset_name_pattern: string | null
  fluid_config: {
    preserve_schema: boolean
    backup_previous: boolean
  } | null
  // Campos para conectores
  connectors_count?: number
}

export interface IntegrationWithStats extends Integration {
  total_runs: number
  successful_runs: number
  failed_runs: number
  last_success_at: string | null
  last_error_at: string | null
}

export interface IntegrationRun {
  id: string
  integration_id: string
  status: 'running' | 'completed' | 'failed'
  file_name: string | null
  file_size: number | null
  records_processed: number | null
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
  // Novos campos
  dataset_id: string | null
  collection_id: string | null
}

export interface IntegrationLog {
  id: string
  integration_id: string
  run_id: string | null
  level: 'info' | 'warning' | 'error'
  message: string
  details: Record<string, any> | null
  created_at: string
}

export interface IntegrationStats {
  failed_runs_today: ReactNode
  total_integrations: number
  active_integrations: number
  total_runs_today: number
  successful_runs_today: number
  total_records_processed: number
}