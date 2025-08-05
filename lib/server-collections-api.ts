// lib/server-collections-api.ts
import { supabaseAdmin } from './supabase-admin'
import { Collection, CollectionDataset } from '@/types/collections'

export class ServerCollectionsAPI {
  /**
   * Busca coleção por ID (sem autenticação)
   */
  static async getCollection(id: string): Promise<Collection | null> {
    const { data, error } = await supabaseAdmin
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

  /**
   * Busca dataset atual de uma coleção fluida
   */
  static async getCurrentDataset(collectionId: string): Promise<CollectionDataset | null> {
    const { data, error } = await supabaseAdmin
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

  /**
   * Arquiva versão anterior (marca is_current como false)
   */
  static async archivePreviousVersion(collectionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('datasets')
      .update({ is_current: false })
      .eq('collection_id', collectionId)
      .eq('is_current', true)

    if (error) {
      throw new Error(`Erro ao arquivar versão anterior: ${error.message}`)
    }
  }

  /**
   * Atualiza estatísticas da coleção
   */
  static async updateCollectionStats(collectionId: string): Promise<void> {
    // Buscar estatísticas dos datasets da coleção
    const { data: datasets, error } = await supabaseAdmin
      .from('datasets')
      .select('total_rows, created_at')
      .eq('collection_id', collectionId)
      .eq('status', 'confirmed')

    if (error) {
      console.error('Erro ao buscar datasets para estatísticas:', error)
      return
    }

    const datasetCount = datasets?.length || 0
    const totalRows = datasets?.reduce((sum, d) => sum + (d.total_rows || 0), 0) || 0
    
    // Última data de upload
    const sortedDatasets = datasets?.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastUpload = sortedDatasets?.[0]?.created_at || null

    // Atualizar estatísticas da coleção
    const { error: updateError } = await supabaseAdmin
      .from('collections')
      .update({
        dataset_count: datasetCount,
        total_rows: totalRows,
        last_upload: lastUpload,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)

    if (updateError) {
      console.error('Erro ao atualizar estatísticas da coleção:', updateError)
    }
  }
}