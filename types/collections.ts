export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  category: string
  is_fluid: boolean
  created_at: string
  updated_at: string
  dataset_count: number
  total_records: number
  last_upload: string | null
}

export interface CollectionDataset {
  id: string
  collection_id: string
  name: string
  description: string | null
  file_name: string
  file_size: number
  total_rows: number
  total_columns: number
  status: 'analyzing' | 'pending_adjustment' | 'confirmed' | 'error'
  is_current: boolean // Para upload fluido, indica se é a versão atual
  version: number // Versionamento para upload fluido
  created_at: string
  updated_at: string
}

export interface CreateCollectionData {
  name: string
  description?: string
  category: string
  is_fluid: boolean
}

export interface UploadMode {
  type: 'individual' | 'collection' | 'fluid'
  collection_id?: string
}

export interface FluidUploadConfig {
  collection_id: string
  preserve_schema: boolean
  backup_previous: boolean
}