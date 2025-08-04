export interface Dataset {
  id: string
  user_id: string
  name: string
  description?: string
  file_name: string
  file_size: number
  total_rows: number
  total_columns: number
  status: 'analyzing' | 'pending_adjustment' | 'confirmed' | 'error'
  created_at: string
  updated_at: string
}

export interface DatasetColumn {
  id: string
  dataset_id: string
  column_name: string
  column_index: number
  data_type: DataType
  is_required: boolean
  sample_values: string[]
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
  details?: Record<string, any>
  created_at: string
}

export type DataType = 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone'

export interface AnalysisResult {
  dataset_id: string
  columns: ColumnAnalysis[]
  sample_rows: Record<string, any>[]
  needs_adjustment: boolean
  total_rows: number
  total_columns: number
}

export interface ColumnAnalysis {
  name: string
  index: number
  suggested_type: DataType
  confidence: number
  sample_values: string[]
  issues: string[]
}

export interface UploadProgress {
  phase: 'uploading' | 'analyzing' | 'adjusting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  dataset_id?: string
}

export interface DataTypeAdjustment {
  column_index: number
  column_name: string
  data_type: DataType
  is_required: boolean
}