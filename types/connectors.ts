// types/connectors.ts
export interface Connector {
  id: string
  integration_id: string
  name: string
  description?: string
  api_key: string
  endpoint_url: string
  is_active: boolean
  data_format: 'json' | 'csv' | 'xml'
  refresh_interval: number // minutos
  last_accessed_at: string | null
  access_count: number
  created_at: string
  updated_at: string
}

export interface CreateConnectorData {
  integration_id: string
  name: string
  description?: string
  data_format: 'json' | 'csv' | 'xml'
  refresh_interval: number
}

export interface ConnectorStats {
  total_connectors: number
  active_connectors: number
  total_requests_today: number
  most_accessed: Connector | null
}

export interface ConnectorEndpointInfo {
  endpoint_url: string
  api_key: string
  data_format: string
  sample_response: any
  schema: any
  last_updated: string
  total_records: number
}