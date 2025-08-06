// lib/connectors-api.ts
import { supabase } from './supabase'
import { 
  Connector, 
  CreateConnectorData, 
  ConnectorStats, 
  ConnectorEndpointInfo 
} from '@/types/connectors'

export class ConnectorsAPI {
  // Criar conector
  static async createConnector(data: CreateConnectorData): Promise<string> {
    const apiKey = `conn_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    
    const insertData = {
      integration_id: data.integration_id,
      name: data.name,
      description: data.description || null,
      api_key: apiKey,
      endpoint_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/connectors/${data.integration_id}/data?key=${apiKey}`,
      is_active: true,
      data_format: data.data_format,
      refresh_interval: data.refresh_interval,
      access_count: 0
    }

    const { data: result, error } = await supabase
      .from('integration_connectors')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar conector: ${error.message}`)
    }

    return result.id
  }

  // Buscar conectores por integração
  static async getConnectorsByIntegration(integrationId: string): Promise<Connector[]> {
    const { data, error } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar conectores: ${error.message}`)
    }

    return data || []
  }

  // Buscar todos os conectores
  static async getAllConnectors(): Promise<Connector[]> {
    const { data, error } = await supabase
      .from('integration_connectors')
      .select(`
        *,
        integrations!inner(
          name,
          source_system
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar conectores: ${error.message}`)
    }

    return data || []
  }

  // Buscar conector por API key
  static async getConnectorByApiKey(apiKey: string): Promise<Connector | null> {
    const { data, error } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar conector: ${error.message}`)
    }

    return data
  }

  // Atualizar conector
  static async updateConnector(id: string, updates: Partial<Connector>): Promise<void> {
    const { error } = await supabase
      .from('integration_connectors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao atualizar conector: ${error.message}`)
    }
  }

  // Deletar conector
  static async deleteConnector(id: string): Promise<void> {
    const { error } = await supabase
      .from('integration_connectors')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar conector: ${error.message}`)
    }
  }

  // Alternar status do conector
  static async toggleConnectorStatus(id: string): Promise<void> {
    const { data: connector, error: fetchError } = await supabase
      .from('integration_connectors')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Erro ao buscar conector: ${fetchError.message}`)
    }

    const { error } = await supabase
      .from('integration_connectors')
      .update({
        is_active: !connector.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao alterar status do conector: ${error.message}`)
    }
  }

  // Incrementar contador de acesso
  static async incrementAccessCount(connectorId: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_connector_access', { connector_id: connectorId })

    if (error) {
      console.error('Erro ao incrementar contador de acesso:', error)
    }
  }

  // Estatísticas dos conectores
  static async getConnectorStats(): Promise<ConnectorStats> {
    try {
      const { count: totalConnectors } = await supabase
        .from('integration_connectors')
        .select('*', { count: 'exact', head: true })

      const { count: activeConnectors } = await supabase
        .from('integration_connectors')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Buscar conector mais acessado
      const { data: mostAccessed } = await supabase
        .from('integration_connectors')
        .select('*')
        .order('access_count', { ascending: false })
        .limit(1)
        .single()

      return {
        total_connectors: totalConnectors || 0,
        active_connectors: activeConnectors || 0,
        total_requests_today: 0, // TODO: Implementar contagem por dia
        most_accessed: mostAccessed || null
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_connectors: 0,
        active_connectors: 0,
        total_requests_today: 0,
        most_accessed: null
      }
    }
  }

  // Buscar informações do endpoint
  static async getConnectorEndpointInfo(integrationId: string, apiKey: string): Promise<ConnectorEndpointInfo | null> {
    try {
      // Buscar conector
      const connector = await this.getConnectorByApiKey(apiKey)
      if (!connector) return null

      // Buscar dados da integração para exemplo
      const { data: latestRun } = await supabase
        .from('integration_runs')
        .select('*')
        .eq('integration_id', integrationId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      // Buscar amostra de dados (primeiros 5 registros)
      let sampleResponse = []
      let totalRecords = 0
      
      if (latestRun?.dataset_id) {
        const { data: sampleData, count } = await supabase
          .from('dataset_rows')
          .select('data', { count: 'exact' })
          .eq('dataset_id', latestRun.dataset_id)
          .limit(5)

        sampleResponse = sampleData?.map(record => record.data) || []
        totalRecords = count || 0
      }

      return {
        endpoint_url: connector.endpoint_url,
        api_key: connector.api_key,
        data_format: connector.data_format,
        sample_response: sampleResponse,
        schema: sampleResponse.length > 0 ? this.generateSchema(sampleResponse[0]) : {},
        last_updated: latestRun?.completed_at || connector.updated_at,
        total_records: totalRecords
      }
    } catch (error) {
      console.error('Erro ao buscar informações do endpoint:', error)
      return null
    }
  }

  // Gerar esquema baseado nos dados
  private static generateSchema(sampleData: any): any {
    if (!sampleData || typeof sampleData !== 'object') return {}

    const schema: any = {}
    for (const [key, value] of Object.entries(sampleData)) {
      schema[key] = {
        type: typeof value,
        example: value
      }
    }
    return schema
  }
}