import { supabase, setCurrentUser } from './supabase'
import { Collection, CollectionDataset, CreateCollectionData } from '@/types/collections'
import { getStoredAuthData } from './auth'

export class CollectionsAPI {
  private static async ensureAuth(): Promise<string> {
    const authData = getStoredAuthData()
    if (!authData?.user) {
      throw new Error('Usuário não autenticado')
    }
    
    await setCurrentUser(authData.user.id)
    return authData.user.id
  }

  static async createCollection(data: CreateCollectionData): Promise<string> {
    const userId = await this.ensureAuth()

    const { data: result, error } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        is_fluid: data.is_fluid
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar coleção: ${error.message}`)
    }

    return result.id
  }

  static async getCollections(): Promise<Collection[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        datasets(count)
      `)
      .order('name')

    if (error) {
      throw new Error(`Erro ao buscar coleções: ${error.message}`)
    }

    return data?.map(collection => ({
      ...collection,
      dataset_count: collection.datasets?.[0]?.count || 0,
      total_records: 0, // Será calculado separadamente se necessário
      last_upload: null // Será calculado separadamente se necessário
    })) || []
  }

  static async getCollection(id: string): Promise<Collection | null> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar coleção: ${error.message}`)
    }

    return data
  }

  static async getCollectionDatasets(collectionId: string): Promise<CollectionDataset[]> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('collection_id', collectionId)
      .order('version', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar datasets da coleção: ${error.message}`)
    }

    return data || []
  }

  static async getCurrentDataset(collectionId: string): Promise<CollectionDataset | null> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('is_current', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Erro ao buscar dataset atual: ${error.message}`)
    }

    return data
  }

  static async updateCollection(id: string, updates: Partial<CreateCollectionData>): Promise<void> {
    await this.ensureAuth()

    const { error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao atualizar coleção: ${error.message}`)
    }
  }

  static async deleteCollection(id: string): Promise<void> {
    await this.ensureAuth()

    // Primeiro, verificar se há datasets
    const { data: datasets } = await supabase
      .from('datasets')
      .select('id')
      .eq('collection_id', id)

    if (datasets && datasets.length > 0) {
      throw new Error('Não é possível excluir uma coleção que contém datasets')
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir coleção: ${error.message}`)
    }
  }

  static async archivePreviousVersion(collectionId: string): Promise<void> {
    await this.ensureAuth()

    // Marcar todos os datasets da coleção como não-atual
    const { error } = await supabase
      .from('datasets')
      .update({ is_current: false })
      .eq('collection_id', collectionId)
      .eq('is_current', true)

    if (error) {
      throw new Error(`Erro ao arquivar versão anterior: ${error.message}`)
    }
  }

  static async getCollectionStats(collectionId: string): Promise<{
    total_datasets: number
    total_records: number
    total_size: number
    last_upload: string | null
  }> {
    await this.ensureAuth()

    const { data, error } = await supabase
      .from('datasets')
      .select('total_rows, file_size, created_at')
      .eq('collection_id', collectionId)
      .eq('status', 'confirmed')

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }

    const datasets = data || []
    const total_records = datasets.reduce((sum, d) => sum + (d.total_rows || 0), 0)
    const total_size = datasets.reduce((sum, d) => sum + (d.file_size || 0), 0)
    const last_upload = datasets.length > 0 
      ? datasets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    return {
      total_datasets: datasets.length,
      total_records,
      total_size,
      last_upload
    }
  }
}