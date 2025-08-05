import { supabase, setCurrentUser } from './supabase'
import { DatasetWithDetails, DatasetColumnInfo, DatasetRowData } from '@/types/reports'
import { CollectionWithStats, IndividualDataset, ReportsOverview } from '@/types/reports-enhanced'
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

  static async getReportsOverview(): Promise<ReportsOverview> {
    await this.ensureAuth()

    // Buscar coleções com estatísticas
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collections')
      .select(`
        *,
        datasets!inner(
          id,
          name,
          file_name,
          file_size,
          total_rows,
          total_columns,
          status,
          created_at,
          updated_at,
          is_current,
          version
        )
      `)
      .order('name')

    if (collectionsError) {
      throw new Error(`Erro ao buscar coleções: ${collectionsError.message}`)
    }

    // Buscar datasets individuais (sem coleção)
    const { data: individualData, error: individualError } = await supabase
      .from('datasets')
      .select('*')
      .is('collection_id', null)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })

    if (individualError) {
      throw new Error(`Erro ao buscar datasets individuais: ${individualError.message}`)
    }

    // Processar coleções com estatísticas
    const collections: CollectionWithStats[] = collectionsData?.map(collection => {
      const datasets = collection.datasets || []
      const currentDataset = datasets.find((d: any) => d.is_current)
      const totalRecords = datasets.reduce((sum: number, d: any) => sum + (d.total_rows || 0), 0)
      const totalSize = datasets.reduce((sum: number, d: any) => sum + (d.file_size || 0), 0)
      const sortedDatasets = datasets.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const lastUpload = sortedDatasets.length > 0 ? sortedDatasets[0].created_at : null

      return {
        ...collection,
        current_dataset: currentDataset,
        total_records: totalRecords,
        total_size: totalSize,
        last_upload: lastUpload,
        dataset_count: datasets.length
      }
    }) || []

    const individual_datasets: IndividualDataset[] = individualData || []

    // Calcular estatísticas totais
    const totalCollectionRecords = collections.reduce((sum, c) => sum + c.total_records, 0)
    const totalIndividualRecords = individual_datasets.reduce((sum, d) => sum + d.total_rows, 0)
    const totalCollectionSize = collections.reduce((sum, c) => sum + c.total_size, 0)
    const totalIndividualSize = individual_datasets.reduce((sum, d) => sum + d.file_size, 0)

    return {
      collections,
      individual_datasets,
      total_stats: {
        total_collections: collections.length,
        total_datasets: collections.reduce((sum, c) => sum + c.dataset_count, 0) + individual_datasets.length,
        total_records: totalCollectionRecords + totalIndividualRecords,
        total_size: totalCollectionSize + totalIndividualSize
      }
    }
  }

  static async getCollectionDatasets(collectionId: string): Promise<DatasetWithDetails[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('status', 'confirmed')
      .order('version', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar datasets da coleção: ${error.message}`)
    }

    return data || []
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    await this.ensureAuth()

    const { data: datasets } = await supabase
      .from('datasets')
      .select('id')
      .eq('collection_id', collectionId)

    if (datasets && datasets.length > 0) {
      throw new Error('Não é possível excluir uma coleção que contém datasets. Exclua os datasets primeiro.')
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)

    if (error) {
      throw new Error(`Erro ao excluir coleção: ${error.message}`)
    }
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