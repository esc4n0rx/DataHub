// lib/server-upload-api.ts
import { supabaseAdmin } from './supabase-admin'
import { DataType } from '@/types/upload'

interface CreateDatasetOptions {
  collection_id?: string
  is_current?: boolean
  version?: number
  user_id?: string // Para integrações, definir usuário padrão
}

export class ServerUploadAPI {
  /**
   * Cria dataset (sem autenticação - para integrações)
   */
  static async createDataset(
    name: string,
    fileName: string,
    fileSize: number,
    totalRows: number,
    totalColumns: number,
    description?: string,
    options?: CreateDatasetOptions
  ): Promise<string> {
    // Usar usuário padrão para integrações (pode ser configurado)
    const userId = options?.user_id || process.env.INTEGRATION_USER_ID || '1'

    const { data, error } = await supabaseAdmin
      .from('datasets')
      .insert({
        user_id: userId,
        name,
        description,
        file_name: fileName,
        file_size: fileSize,
        total_rows: totalRows,
        total_columns: totalColumns,
        status: 'analyzing',
        collection_id: options?.collection_id || null,
        is_current: options?.is_current ?? false,
        version: options?.version ?? 1
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar dataset: ${error.message}`)
    }

    return data.id
  }

  /**
   * Atualiza status do dataset
   */
  static async updateDatasetStatus(
    datasetId: string, 
    status: 'pending' | 'analyzing' | 'analyzed' | 'confirmed' | 'error'
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('datasets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', datasetId)

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }
  }

  /**
   * Salva colunas do dataset
   */
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
    const columnsData = columns.map(col => ({
      dataset_id: datasetId,
      column_name: col.name,
      column_index: col.index,
      data_type: col.data_type,
      is_required: col.is_required,
      sample_values: col.sample_values
    }))

    const { error } = await supabaseAdmin
      .from('dataset_columns')
      .insert(columnsData)

    if (error) {
      throw new Error(`Erro ao salvar colunas: ${error.message}`)
    }
  }

  /**
   * Salva linhas de dados do dataset
   */
  static async saveRows(
    datasetId: string,
    data: Record<string, any>[]
  ): Promise<void> {
    if (data.length === 0) return

    // Salvar em lotes de 1000 registros para evitar timeout
    const batchSize = 1000
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const rowsData = batch.map((row, index) => ({
        dataset_id: datasetId,
        row_index: i + index,
        data: row
      }))

      const { error } = await supabaseAdmin
        .from('dataset_rows')
        .insert(rowsData)

      if (error) {
        throw new Error(`Erro ao salvar dados (lote ${Math.floor(i/batchSize) + 1}): ${error.message}`)
      }
    }
  }

  /**
   * Remove todos os dados de uma coleção (para upload fluido)
   */
  static async clearCollectionData(collectionId: string): Promise<void> {
    // Buscar datasets da coleção
    const { data: datasets, error: fetchError } = await supabaseAdmin
      .from('datasets')
      .select('id')
      .eq('collection_id', collectionId)

    if (fetchError) {
      throw new Error(`Erro ao buscar datasets da coleção: ${fetchError.message}`)
    }

    if (!datasets || datasets.length === 0) return

    const datasetIds = datasets.map(d => d.id)

    // Remover dados das linhas
    const { error: rowsError } = await supabaseAdmin
      .from('dataset_rows')
      .delete()
      .in('dataset_id', datasetIds)

    if (rowsError) {
      throw new Error(`Erro ao remover dados das linhas: ${rowsError.message}`)
    }

    // Remover colunas
    const { error: columnsError } = await supabaseAdmin
      .from('dataset_columns')
      .delete()
      .in('dataset_id', datasetIds)

    if (columnsError) {
      throw new Error(`Erro ao remover colunas: ${columnsError.message}`)
    }

    // Remover logs
    const { error: logsError } = await supabaseAdmin
      .from('upload_logs')
      .delete()
      .in('dataset_id', datasetIds)

    if (logsError) {
      console.warn('Erro ao remover logs:', logsError)
    }

    // Remover datasets
    const { error: datasetsError } = await supabaseAdmin
      .from('datasets')
      .delete()
      .in('id', datasetIds)

    if (datasetsError) {
      throw new Error(`Erro ao remover datasets: ${datasetsError.message}`)
    }
  }

  /**
   * Adiciona log do processamento
   */
  static async log(
    datasetId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabaseAdmin
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
}