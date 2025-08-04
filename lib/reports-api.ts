import { supabase, setCurrentUser } from './supabase'
import { DatasetWithDetails, DatasetColumnInfo, DatasetRowData } from '@/types/reports'
import { getStoredAuthData } from './auth'

export class ReportsAPI {
  private static async ensureAuth(): Promise<string> {
    const authData = getStoredAuthData()
    if (!authData?.user) {
      throw new Error('Usuário não autenticado')
    }
    
    await setCurrentUser(authData.user.id)
    return authData.user.id
  }

  static async getDatasets(): Promise<DatasetWithDetails[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('status', 'confirmed')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Erro ao buscar datasets: ${error.message}`)
    }

    return data
  }

  static async getDatasetColumns(datasetId: string): Promise<DatasetColumnInfo[]> {
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

  static async getDatasetRows(
    datasetId: string,
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    column?: string
  ): Promise<{ rows: DatasetRowData[], total: number }> {
    await this.ensureAuth()

    let query = supabase
      .from('dataset_rows')
      .select('*', { count: 'exact' })
      .eq('dataset_id', datasetId)

    // Filtro de busca
    if (search && search.trim()) {
      if (column) {
        query = query.ilike(`data->${column}`, `%${search}%`)
      } else {
        // Busca em qualquer coluna (PostgreSQL JSONB)
        query = query.textSearch('data', search)
      }
    }

    // Paginação
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query
      .order('row_index')
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`)
    }

    return {
      rows: data || [],
      total: count || 0
    }
  }

  static async getAllDatasetRows(datasetId: string): Promise<DatasetRowData[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('dataset_rows')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('row_index')

    if (error) {
      throw new Error(`Erro ao buscar todos os dados: ${error.message}`)
    }

    return data || []
  }

  static async getDatasetDetails(datasetId: string): Promise<DatasetWithDetails | null> {
    const dataset = await this.getDatasets()
    const found = dataset.find(d => d.id === datasetId)
    
    if (!found) return null

    const [columns, { rows }] = await Promise.all([
      this.getDatasetColumns(datasetId),
      this.getDatasetRows(datasetId, 1, 10) // Apenas uma amostra
    ])

    return {
      ...found,
      columns,
      rows
    }
  }
}