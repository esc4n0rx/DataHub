export type DataType = 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone'

export interface Dataset {
  id: string
  user_id: string
  name: string
  description: string | null
  file_name: string
  file_size: number
  total_rows: number
  total_columns: number
  status: 'analyzing' | 'pending_adjustment' | 'confirmed' | 'error'
  created_at: string
  updated_at: string
  // Novos campos para coleções
  collection_id?: string
  is_current?: boolean
  version?: number
}

export interface DatasetColumn {
  id: string
  dataset_id: string
  column_name: string
  column_index: number
  data_type: DataType
  is_required: boolean
  sample_values: string[] | null
  created_at: string
}

export interface DatasetRow {
  id: string
  dataset_id: string
  row_index: number
  data: Record<string, any>
  created_at: string
}

export interface UploadLog {
  id: string
  dataset_id: string
  level: 'info' | 'warning' | 'error'
  message: string
  details: Record<string, any> | null
  created_at: string
}

export interface ColumnAnalysis {
  name: string
  index: number
  suggested_type: DataType
  confidence: number
  sample_values: string[]
  issues: string[]
}

export interface AnalysisResult {
  dataset_id: string
  columns: ColumnAnalysis[]
  sample_rows: Record<string, any>[]
  needs_adjustment: boolean
  total_rows: number
  total_columns: number
  // Novos campos
  collection_id?: string
  is_fluid_upload?: boolean
  schema_compatible?: boolean
}

export interface UploadProgress {
  phase: 'uploading' | 'analyzing' | 'adjusting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  dataset_id?: string
  collection_id?: string
}

export interface DataTypeAdjustment {
  column_index: number
  column_name: string
  data_type: DataType
  is_required: boolean
}