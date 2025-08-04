import { supabase, setCurrentUser } from './supabase'
import { DashboardStats, RecentActivity, ActivitySummary } from '@/types/dashboard'
import { getStoredAuthData } from './auth'

export class DashboardAPI {
  private static async ensureAuth(): Promise<string> {
    const authData = getStoredAuthData()
    if (!authData?.user) {
      throw new Error('Usuário não autenticado')
    }
    
    await setCurrentUser(authData.user.id)
    return authData.user.id
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    await this.ensureAuth()

    // Buscar estatísticas dos datasets
    const { data: datasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('total_rows, file_size, status')

    if (datasetsError) {
      throw new Error(`Erro ao buscar datasets: ${datasetsError.message}`)
    }

    // Calcular estatísticas
    const confirmedDatasets = datasets?.filter(d => d.status === 'confirmed') || []
    const totalRecords = confirmedDatasets.reduce((sum, d) => sum + (d.total_rows || 0), 0)
    const totalSize = confirmedDatasets.reduce((sum, d) => sum + (d.file_size || 0), 0)

    // Buscar estatísticas de uploads dos últimos 30 dias para calcular crescimento
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentDatasets } = await supabase
      .from('datasets')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const growthRate = recentDatasets ? (recentDatasets.length / Math.max(datasets?.length || 1, 1)) * 100 : 0

    return {
      total_datasets: confirmedDatasets.length,
      total_records: totalRecords,
      total_size: totalSize,
      processed_files: datasets?.length || 0,
      growth_rate: Math.round(growthRate * 100) / 100,
      active_users: 1 // Como é single-user, sempre 1
    }
  }

  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    await this.ensureAuth()

    // Buscar logs recentes
    const { data: logs, error } = await supabase
      .from('upload_logs')
      .select(`
        id,
        message,
        level,
        created_at,
        details,
        datasets(name, file_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Erro ao buscar atividades: ${error.message}`)
    }

    return logs?.map(log => ({
      id: log.id,
      action: this.getActionFromMessage(log.message),
      file_name: (log.datasets as any)?.file_name || 'Arquivo desconhecido',
      user_name: 'Administrador DataHub',
      timestamp: log.created_at,
      status: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'success',
      details: log.message
    })) || []
  }

  static async getActivitySummary(): Promise<ActivitySummary> {
    await this.ensureAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Ações hoje
    const { data: todayLogs } = await supabase
      .from('upload_logs')
      .select('id')
      .gte('created_at', today.toISOString())

    // Uploads hoje
    const { data: todayUploads } = await supabase
      .from('datasets')
      .select('id')
      .gte('created_at', today.toISOString())

    // Datasets confirmados esta semana (como "relatórios")
    const { data: weekReports } = await supabase
      .from('datasets')
      .select('id')
      .eq('status', 'confirmed')
      .gte('created_at', weekAgo.toISOString())

    // Taxa de sucesso (baseada nos logs)
    const { data: allLogs } = await supabase
      .from('upload_logs')
      .select('level')
      .gte('created_at', weekAgo.toISOString())

    const totalLogs = allLogs?.length || 0
    const errorLogs = allLogs?.filter(log => log.level === 'error').length || 0
    const successRate = totalLogs > 0 ? ((totalLogs - errorLogs) / totalLogs) * 100 : 100

    return {
      actions_today: todayLogs?.length || 0,
      uploads_today: todayUploads?.length || 0,
      reports_this_week: weekReports?.length || 0,
      success_rate: Math.round(successRate * 100) / 100
    }
  }

  private static getActionFromMessage(message: string): string {
    if (message.includes('upload') || message.includes('enviado')) return 'Upload de arquivo'
    if (message.includes('análise') || message.includes('analisado')) return 'Análise de dados'
    if (message.includes('processado') || message.includes('sucesso')) return 'Processamento concluído'
    if (message.includes('backup')) return 'Backup automático'
    if (message.includes('sincronização')) return 'Sincronização'
    return 'Atividade do sistema'
  }
}