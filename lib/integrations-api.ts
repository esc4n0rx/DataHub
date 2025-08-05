// lib/integrations-api.ts (CORRIGIDO)
import { supabase } from './supabase'
import { 
  Integration, 
  IntegrationRun, 
  IntegrationLog, 
  CreateIntegrationData, 
  IntegrationStats,
  IntegrationWithStats 
} from '@/types/integrations'

interface UpdateIntegrationData extends Partial<CreateIntegrationData> {
  status?: 'active' | 'inactive' | 'error'
}

export class IntegrationsAPI {
  // Integrações
  static async createIntegration(data: CreateIntegrationData): Promise<string> {
    // Gerar API key única
    const apiKey = `dhub_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`

    const insertData = {
      name: data.name,
      description: data.description || null,
      type: data.type,
      source_system: data.source_system,
      target_collection_id: data.target_collection_id || null,
      file_pattern: data.file_pattern,
      schedule_cron: data.schedule_cron || null,
      api_key: apiKey,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/webhook/${apiKey}`,
      file_retention_days: data.file_retention_days,
      status: 'active',
      // Novos campos
      upload_type: data.upload_type,
      dataset_name_pattern: data.dataset_name_pattern || null,
      fluid_config: data.fluid_config || null
    }

    console.log('Inserindo integração:', insertData)

    const { data: result, error } = await supabase
      .from('integrations')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('Erro detalhado:', error)
      throw new Error(`Erro ao criar integração: ${error.message}`)
    }

    return result.id
  }

  static async getIntegrations(): Promise<IntegrationWithStats[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select(`
        *,
        integration_runs (
          status,
          completed_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      throw new Error(`Erro ao buscar integrações: ${error.message}`)
    }

    if (!data) return []

    return data.map(integration => {
      const runs = integration.integration_runs || []
      const successfulRuns = runs.filter((r: any) => r.status === 'completed')
      const failedRuns = runs.filter((r: any) => r.status === 'failed')
      
      const lastSuccess = successfulRuns
        .sort((a: any, b: any) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())[0]
      
      const lastError = failedRuns
        .sort((a: any, b: any) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())[0]

      return {
        ...integration,
        total_runs: runs.length,
        successful_runs: successfulRuns.length,
        failed_runs: failedRuns.length,
        last_success_at: lastSuccess?.completed_at || lastSuccess?.created_at || null,
        last_error_at: lastError?.completed_at || lastError?.created_at || null,
        integration_runs: undefined // Remove para não poluir
      }
    })
  }

  static async getIntegration(id: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar integração: ${error.message}`)
    }

    return data
  }

  static async updateIntegration(id: string, updates: UpdateIntegrationData): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao atualizar integração: ${error.message}`)
    }
  }

  static async deleteIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar integração: ${error.message}`)
    }
  }

  static async toggleIntegrationStatus(id: string): Promise<void> {
    // Buscar status atual
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Erro ao buscar integração: ${fetchError.message}`)
    }

    const newStatus = integration.status === 'active' ? 'inactive' : 'active'

    const { error } = await supabase
      .from('integrations')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao alterar status: ${error.message}`)
    }
  }

  // Execuções
  static async getIntegrationRuns(integrationId: string, limit = 50): Promise<IntegrationRun[]> {
    const { data, error } = await supabase
      .from('integration_runs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Erro ao buscar execuções: ${error.message}`)
    }

    return data || []
  }

  static async getIntegrationRun(runId: string): Promise<IntegrationRun | null> {
    const { data, error } = await supabase
      .from('integration_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar execução: ${error.message}`)
    }

    return data
  }

  // Logs
  static async getIntegrationLogs(
    integrationId: string, 
    runId?: string, 
    limit = 100
  ): Promise<IntegrationLog[]> {
    let query = supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_id', integrationId)

    if (runId) {
      query = query.eq('run_id', runId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Erro ao buscar logs: ${error.message}`)
    }

    return data || []
  }

  // Estatísticas (CORRIGIDO para incluir failed_runs_today)
  static async getIntegrationStats(): Promise<IntegrationStats> {
    const today = new Date().toISOString().split('T')[0]

    try {
      // Total de integrações
      const { count: totalIntegrations } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })

      // Integrações ativas
      const { count: activeIntegrations } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Execuções de hoje
      const { data: todayRuns } = await supabase
        .from('integration_runs')
        .select('status, records_processed')
        .gte('created_at', `${today}T00:00:00`)

      // Todas as execuções completas para total de arquivos
      const { count: totalFilesProcessed } = await supabase
        .from('integration_runs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const totalRunsToday = todayRuns?.length || 0
      const successfulRunsToday = todayRuns?.filter(r => r.status === 'completed').length || 0
      const failedRunsToday = todayRuns?.filter(r => r.status === 'failed').length || 0
      const totalRecordsProcessed = todayRuns?.reduce((sum, run) => sum + (run.records_processed || 0), 0) || 0

      return {
        total_integrations: totalIntegrations || 0,
        active_integrations: activeIntegrations || 0,
        total_runs_today: totalRunsToday,
        successful_runs_today: successfulRunsToday,
        failed_runs_today: failedRunsToday, 
        total_records_processed: totalFilesProcessed || 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)

      return {
        total_integrations: 0,
        active_integrations: 0,
        total_runs_today: 0,
        successful_runs_today: 0,
        failed_runs_today: 0, 
        total_records_processed: 0
      }
    }
  }
}