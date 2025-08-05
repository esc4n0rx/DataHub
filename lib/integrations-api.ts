import { supabase } from './supabase'
import { 
  Integration, 
  IntegrationRun, 
  IntegrationLog, 
  CreateIntegrationData, 
  IntegrationStats,
  IntegrationWithStats 
} from '@/types/integrations'

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
      status: 'active'
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

  static async updateIntegration(id: string, updates: Partial<Integration>): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .update({ ...updates, updated_at: new Date().toISOString() })
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

  // Execuções
  static async getIntegrationRuns(integrationId: string, limit: number = 50): Promise<IntegrationRun[]> {
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

  static async createIntegrationRun(integrationId: string, fileName?: string, fileSize?: number): Promise<string> {
    const { data, error } = await supabase
      .from('integration_runs')
      .insert({
        integration_id: integrationId,
        status: 'running',
        file_name: fileName || null,
        file_size: fileSize || null,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar execução: ${error.message}`)
    }

    return data.id
  }

  static async updateIntegrationRun(
    runId: string, 
    updates: Partial<IntegrationRun>
  ): Promise<void> {
    const { error } = await supabase
      .from('integration_runs')
      .update(updates)
      .eq('id', runId)

    if (error) {
      throw new Error(`Erro ao atualizar execução: ${error.message}`)
    }
  }

  // Logs
  static async getIntegrationLogs(
    integrationId: string, 
    runId?: string, 
    limit: number = 100
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

  static async createIntegrationLog(
    integrationId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    runId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('integration_logs')
      .insert({
        integration_id: integrationId,
        run_id: runId || null,
        level,
        message,
        details: details || null
      })

    if (error) {
      throw new Error(`Erro ao criar log: ${error.message}`)
    }
  }

  // Estatísticas  
  static async getIntegrationStats(): Promise<IntegrationStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString()

    try {
      // Buscar integrações
      const { data: integrations } = await supabase
        .from('integrations')
        .select('status')

      // Buscar execuções de hoje
      const { data: runsToday } = await supabase
        .from('integration_runs')
        .select('status, records_processed')
        .gte('created_at', todayIso)

      // Buscar todas as execuções para totais
      const { data: allRuns } = await supabase
        .from('integration_runs')
        .select('records_processed')
        .eq('status', 'completed')

      const totalIntegrations = integrations?.length || 0
      const activeIntegrations = integrations?.filter(i => i.status === 'active').length || 0
      const totalRunsToday = runsToday?.length || 0
      const successfulRunsToday = runsToday?.filter(r => r.status === 'completed').length || 0
      const failedRunsToday = runsToday?.filter(r => r.status === 'failed').length || 0
      const totalFilesProcessed = allRuns?.length || 0
      const totalRecordsProcessed = allRuns?.reduce((sum, run) => sum + (run.records_processed || 0), 0) || 0

      return {
        total_integrations: totalIntegrations,
        active_integrations: activeIntegrations,
        total_runs_today: totalRunsToday,
        successful_runs_today: successfulRunsToday,
        failed_runs_today: failedRunsToday,
        total_files_processed: totalFilesProcessed,
        total_records_processed: totalRecordsProcessed
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      // Retornar estatísticas vazias em caso de erro
      return {
        total_integrations: 0,
        active_integrations: 0,
        total_runs_today: 0,
        successful_runs_today: 0,
        failed_runs_today: 0,
        total_files_processed: 0,
        total_records_processed: 0
      }
    }
  }
}