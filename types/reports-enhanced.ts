import { Collection, CollectionDataset } from './collections'

export interface ReportsView {
  type: 'overview' | 'collection' | 'dataset'
  collection_id?: string
  dataset_id?: string
}

export interface ReportsNavigation {
  path: Array<{
    type: 'overview' | 'collection' | 'dataset'
    id?: string
    name: string
  }>
}

export interface CollectionWithStats extends Collection {
  current_dataset?: CollectionDataset
  total_records: number
  total_size: number
  last_upload: string | null
}

export interface IndividualDataset {
  id: string
  name: string
  description: string | null
  file_name: string
  file_size: number
  total_rows: number
  total_columns: number
  status: string
  created_at: string
  updated_at: string
  collection_id: null
  is_current: boolean
  version: number
}

export interface ReportsOverview {
  collections: CollectionWithStats[]
  individual_datasets: IndividualDataset[]
  total_stats: {
    total_collections: number
    total_datasets: number
    total_records: number
    total_size: number
  }
}