import { supabase, setCurrentUser } from './supabase'
import { Dataset, DatasetColumn, UploadLog, DataType, DataTypeAdjustment } from '@/types/upload'
import { getStoredAuthData } from './auth'

export class UploadAPI {
  private static async ensureAuth(): Promise<string> {
    const authData = getStoredAuthData()
    if (!authData?.user) {
      throw new Error('Usuário não autenticado')
    }
    
    // Configura o usuário atual para RLS
    await setCurrentUser(authData.user.id)
    return authData.user.id
  }

  static async createDataset(
    name: string,
    fileName: string,
    fileSize: number,
    totalRows: number,
    totalColumns: number,
    description?: string
  ): Promise<string> {
    const userId = await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .insert({
        user_id: userId,
        name,
        description,
        file_name: fileName,
        file_size: fileSize,
        total_rows: totalRows,
        total_columns: totalColumns,
        status: 'analyzing'
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar dataset: ${error.message}`)
    }

    return data.id
  }

  static async updateDatasetStatus(
    datasetId: string, 
    status: Dataset['status']
  ): Promise<void> {
    await this.ensureAuth()

    const { error } = await supabase
      .from('datasets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', datasetId)

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }
  }

  static async saveColumns(
    datasetId: string,
    columns: Array<{
      name: string
      index: number
      data_type: DataType
      is_required: boolean
      sample_values: string[]
    }>
  ): Promise<void> {
    await this.ensureAuth()

    const columnsData = columns.map(col => ({
      dataset_id: datasetId,
      column_name: col.name,
      column_index: col.index,
      data_type: col.data_type,
      is_required: col.is_required,
      sample_values: col.sample_values
    }))

    const { error } = await supabase
      .from('dataset_columns')
      .insert(columnsData)

    if (error) {
      throw new Error(`Erro ao salvar colunas: ${error.message}`)
    }
  }

  static async updateColumns(
    datasetId: string,
    adjustments: DataTypeAdjustment[]
  ): Promise<void> {
    await this.ensureAuth()

    for (const adjustment of adjustments) {
      const { error } = await supabase
        .from('dataset_columns')
        .update({
          data_type: adjustment.data_type,
          is_required: adjustment.is_required
        })
        .eq('dataset_id', datasetId)
        .eq('column_index', adjustment.column_index)

      if (error) {
        throw new Error(`Erro ao atualizar coluna: ${error.message}`)
      }
    }
  }

  static async saveRows(
    datasetId: string,
    rows: Record<string, any>[],
    batchSize: number = 1000
  ): Promise<void> {
    await this.ensureAuth()

    // Processa em lotes para evitar timeouts
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const rowsData = batch.map((data, index) => ({
        dataset_id: datasetId,
        row_index: i + index,
        data
      }))

      const { error } = await supabase
        .from('dataset_rows')
        .insert(rowsData)

      if (error) {
        throw new Error(`Erro ao salvar dados (lote ${Math.floor(i / batchSize) + 1}): ${error.message}`)
      }

      // Log de progresso
      await this.log(datasetId, 'info', `Processados ${Math.min(i + batchSize, rows.length)} de ${rows.length} registros`)
    }
  }

  static async log(
    datasetId: string,
    level: UploadLog['level'],
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.ensureAuth()

    const { error } = await supabase
      .from('upload_logs')
      .insert({
        dataset_id: datasetId,
        level,
        message,
        details
      })

    if (error) {
      console.error('Erro ao salvar log:', error)
    }
  }

  static async getLogs(datasetId: string): Promise<UploadLog[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('upload_logs')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Erro ao buscar logs: ${error.message}`)
    }

    return data
  }

  static async getDataset(datasetId: string): Promise<Dataset | null> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar dataset: ${error.message}`)
    }

    return data
  }

  static async getColumns(datasetId: string): Promise<DatasetColumn[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('dataset_columns')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('column_index')

    if (error) {
      throw new Error(`Erro ao buscar colunas: ${error.message}`)
    }

    return data
  }

  static async getUserDatasets(): Promise<Dataset[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar datasets: ${error.message}`)
    }

    return data
  }

  static async deleteDataset(datasetId: string): Promise<void> {
    await this.ensureAuth()

    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', datasetId)

    if (error) {
      throw new Error(`Erro ao excluir dataset: ${error.message}`)
    }
  }
}