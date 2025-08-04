export interface DatasetWithDetails {
  id: string
  name: string
  description: string | null
  file_name: string
  file_size: number
  total_rows: number
  total_columns: number
  status: 'analyzing' | 'pending_adjustment' | 'confirmed' | 'error'
  created_at: string
  updated_at: string
  columns?: DatasetColumnInfo[]
  rows?: DatasetRowData[]
}

export interface DatasetColumnInfo {
  id: string
  column_name: string
  column_index: number
  data_type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone'
  is_required: boolean
  sample_values: string[] | null
}

export interface DatasetRowData {
  id: string
  row_index: number
  data: Record<string, any>
}

export interface DatasetFilters {
  search: string
  column: string | null
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}