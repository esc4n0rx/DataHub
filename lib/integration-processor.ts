// lib/integration-processor.ts (ATUALIZADO)
import { ServerUploadAnalyzer } from './server-upload-analyzer'
import { ServerUploadAPI } from './server-upload-api'
import { ServerCollectionsAPI } from './server-collections-api'
import { supabaseAdmin } from './supabase-admin'
import { Integration, IntegrationRun } from '@/types/integrations'

export class IntegrationProcessor {
  /**
   * Processa arquivo recebido via integração
   */
  static async processFile(
    integration: Integration,
    run: IntegrationRun,
    file: File,
    source?: string
  ): Promise<{ success: boolean; recordsProcessed: number; datasetId?: string }> {
    const logPrefix = `[INTEGRATION-${integration.id}]`
    
    try {
      console.log(`${logPrefix} Iniciando processamento do arquivo: ${file.name}`)
      
      // Log de início
      await this.addLog(integration.id, run.id, 'info', 
        `Iniciando processamento do arquivo: ${file.name}`,
        {
          source: source || 'webhook',
          file_name: file.name,
          file_size: file.size,
          upload_type: integration.upload_type
        }
      )

      // Análise do arquivo usando o analisador server-side
      console.log(`${logPrefix} Analisando arquivo usando ServerUploadAnalyzer...`)
      const fileAnalysis = await ServerUploadAnalyzer.analyzeFile(file)
      
      await this.addLog(integration.id, run.id, 'info', 
        `Arquivo analisado: ${fileAnalysis.totalRows} registros, ${fileAnalysis.headers.length} colunas`
      )

      // Análise das colunas
      console.log(`${logPrefix} Analisando tipos de dados das colunas...`)
      const columnAnalysis = ServerUploadAnalyzer.analyzeColumns(
        fileAnalysis.headers,
        fileAnalysis.data
      )

      await this.addLog(integration.id, run.id, 'info', 
        `Tipos de dados analisados para ${columnAnalysis.length} colunas`
      )

      // Gerar nome do dataset baseado no padrão
      const datasetName = this.generateDatasetName(integration, file.name)
      
      let datasetId: string
      let collectionId: string | null = null

      // Processar baseado no tipo de upload
      switch (integration.upload_type) {
        case 'dataset':
          console.log(`${logPrefix} Criando dataset individual: ${datasetName}`)
          datasetId = await this.createIndividualDataset(
            integration, run, datasetName, file, fileAnalysis, columnAnalysis
          )
          break

        case 'collection':
          console.log(`${logPrefix} Adicionando à coleção: ${integration.target_collection_id}`)
          if (!integration.target_collection_id) {
            throw new Error('Coleção de destino não configurada para upload em coleção')
          }
          const result = await this.addToCollection(
            integration, run, datasetName, file, fileAnalysis, columnAnalysis
          )
          datasetId = result.datasetId
          collectionId = result.collectionId
          break

        case 'fluid':
          console.log(`${logPrefix} Upload fluido na coleção: ${integration.target_collection_id}`)
          if (!integration.target_collection_id) {
            throw new Error('Coleção de destino não configurada para upload fluido')
          }
          const fluidResult = await this.fluidUpdate(
            integration, run, datasetName, file, fileAnalysis, columnAnalysis
          )
          datasetId = fluidResult.datasetId
          collectionId = fluidResult.collectionId
          break

        default:
          throw new Error(`Tipo de upload não suportado: ${integration.upload_type}`)
      }

      // Atualizar run com informações do dataset
      await supabaseAdmin
        .from('integration_runs')
        .update({
          dataset_id: datasetId,
          collection_id: collectionId,
          records_processed: fileAnalysis.totalRows
        })
        .eq('id', run.id)

      await this.addLog(integration.id, run.id, 'info', 
        `Processamento concluído com sucesso. Dataset criado: ${datasetId}`,
        {
          dataset_id: datasetId,
          collection_id: collectionId,
          records_processed: fileAnalysis.totalRows
        }
      )

      console.log(`${logPrefix} Processamento concluído com sucesso`)
      return { 
        success: true, 
        recordsProcessed: fileAnalysis.totalRows,
        datasetId 
      }

    } catch (error: any) {
      console.error(`${logPrefix} Erro no processamento:`, error)
      
      await this.addLog(integration.id, run.id, 'error', 
        `Erro no processamento: ${error.message}`,
        { error: error.message, stack: error.stack }
      )

      throw error
    }
  }

  /**
   * Cria dataset individual
   */
  private static async createIndividualDataset(
    integration: Integration,
    run: IntegrationRun,
    datasetName: string,
    file: File,
    fileAnalysis: any,
    columnAnalysis: any
  ): Promise<string> {
    // Criar dataset usando API server-side
    const datasetId = await ServerUploadAPI.createDataset(
      datasetName,
      file.name,
      file.size,
      fileAnalysis.totalRows,
      fileAnalysis.headers.length,
      `Dataset criado automaticamente via integração: ${integration.name}`
    )

    await this.addLog(integration.id, run.id, 'info', `Dataset criado: ${datasetId}`)

    // Salvar colunas
    await ServerUploadAPI.saveColumns(
      datasetId,
      columnAnalysis.map((col: any) => ({
        name: col.name,
        index: col.index,
        data_type: col.suggested_type,
        is_required: false,
        sample_values: col.sample_values
      }))
    )

    await this.addLog(integration.id, run.id, 'info', 'Configurações de colunas salvas')

    // Para salvar TODOS os dados, usar análise completa
    console.log(`[INTEGRATION-${integration.id}] Processando arquivo completo para salvar todos os dados...`)
    const fullFileAnalysis = await ServerUploadAnalyzer.analyzeFullFile(file)
    
    await ServerUploadAPI.saveRows(datasetId, fullFileAnalysis.data)
    await this.addLog(integration.id, run.id, 'info', `${fullFileAnalysis.totalRows} registros salvos`)

    // Confirmar dataset
    await ServerUploadAPI.updateDatasetStatus(datasetId, 'confirmed')
    await this.addLog(integration.id, run.id, 'info', 'Dataset confirmado e ativo')

    return datasetId
  }

  /**
   * Adiciona dataset a uma coleção
   */
  private static async addToCollection(
    integration: Integration,
    run: IntegrationRun,
    datasetName: string,
    file: File,
    fileAnalysis: any,
    columnAnalysis: any
  ): Promise<{ datasetId: string; collectionId: string }> {
    const collectionId = integration.target_collection_id!

    // Verificar se coleção existe usando API server-side
    const collection = await ServerCollectionsAPI.getCollection(collectionId)
    if (!collection) {
      throw new Error(`Coleção não encontrada: ${collectionId}`)
    }

    // Processar arquivo completo para obter total real de registros
    const fullFileAnalysis = await ServerUploadAnalyzer.analyzeFullFile(file)

    // Criar dataset vinculado à coleção
    const datasetId = await ServerUploadAPI.createDataset(
      datasetName,
      file.name,
      file.size,
      fullFileAnalysis.totalRows,
      fullFileAnalysis.headers.length,
      `Dataset adicionado automaticamente via integração: ${integration.name}`,
      { collection_id: collectionId }
    )

    await this.addLog(integration.id, run.id, 'info', 
      `Dataset criado na coleção "${collection.name}": ${datasetId}`
    )

    // Salvar colunas e dados
    await ServerUploadAPI.saveColumns(
      datasetId,
      columnAnalysis.map((col: any) => ({
        name: col.name,
        index: col.index,
        data_type: col.suggested_type,
        is_required: false,
        sample_values: col.sample_values
      }))
    )

    await ServerUploadAPI.saveRows(datasetId, fullFileAnalysis.data)
    await ServerUploadAPI.updateDatasetStatus(datasetId, 'confirmed')

    // Atualizar estatísticas da coleção
    await ServerCollectionsAPI.updateCollectionStats(collectionId)

    await this.addLog(integration.id, run.id, 'info', 
      `Dataset processado e adicionado à coleção com ${fullFileAnalysis.totalRows} registros`
    )

    return { datasetId, collectionId }
  }

  /**
   * Upload fluido - substitui dados da coleção
   */
  private static async fluidUpdate(
    integration: Integration,
    run: IntegrationRun,
    datasetName: string,
    file: File,
    fileAnalysis: any,
    columnAnalysis: any
  ): Promise<{ datasetId: string; collectionId: string }> {
    const collectionId = integration.target_collection_id!
    const fluidConfig = integration.fluid_config || { preserve_schema: false, backup_previous: false }

    // Verificar se coleção existe e é fluida
    const collection = await ServerCollectionsAPI.getCollection(collectionId)
    if (!collection) {
      throw new Error(`Coleção não encontrada: ${collectionId}`)
    }

    if (!collection.is_fluid) {
      throw new Error(`Coleção "${collection.name}" não está configurada para upload fluido`)
    }

    // Processar arquivo completo
    const fullFileAnalysis = await ServerUploadAnalyzer.analyzeFullFile(file)

    // Backup da versão anterior se necessário
    if (fluidConfig.backup_previous) {
      await ServerCollectionsAPI.archivePreviousVersion(collectionId)
      await this.addLog(integration.id, run.id, 'info', 'Versão anterior arquivada')
    } else {
      // Limpar dados anteriores
      await ServerUploadAPI.clearCollectionData(collectionId)
      await this.addLog(integration.id, run.id, 'info', 'Dados anteriores removidos')
    }

    // Obter versão atual
    const currentVersion = await ServerCollectionsAPI.getCurrentDataset(collectionId)
    const newVersion = (currentVersion?.version || 0) + 1

    // Criar novo dataset como versão atual
    const datasetId = await ServerUploadAPI.createDataset(
      datasetName,
      file.name,
      file.size,
      fullFileAnalysis.totalRows,
      fullFileAnalysis.headers.length,
      `Upload fluido via integração: ${integration.name}`,
      {
        collection_id: collectionId,
        is_current: true,
        version: newVersion
      }
    )

    await this.addLog(integration.id, run.id, 'info', 
      `Nova versão criada (v${newVersion}) na coleção fluida "${collection.name}"`
    )

    // Salvar colunas e dados
    await ServerUploadAPI.saveColumns(
      datasetId,
      columnAnalysis.map((col: any) => ({
        name: col.name,
        index: col.index,
        data_type: col.suggested_type,
        is_required: false,
        sample_values: col.sample_values
      }))
    )

    await ServerUploadAPI.saveRows(datasetId, fullFileAnalysis.data)
    await ServerUploadAPI.updateDatasetStatus(datasetId, 'confirmed')

    // Atualizar estatísticas da coleção
    await ServerCollectionsAPI.updateCollectionStats(collectionId)

    await this.addLog(integration.id, run.id, 'info', 
      `Upload fluido concluído com sucesso. Coleção atualizada com ${fullFileAnalysis.totalRows} registros`
    )

    return { datasetId, collectionId }
  }

  /**
   * Gera nome do dataset baseado no padrão configurado
   */
  private static generateDatasetName(integration: Integration, fileName: string): string {
    const pattern = integration.dataset_name_pattern || integration.name
    const now = new Date()
    
    // Substituir variáveis no padrão
    return pattern
      .replace('{date}', now.toLocaleDateString('pt-BR'))
      .replace('{datetime}', now.toLocaleString('pt-BR'))
      .replace('{timestamp}', now.getTime().toString())
      .replace('{filename}', fileName.replace(/\.[^/.]+$/, "")) // Nome sem extensão
      .replace('{source}', integration.source_system)
      .trim()
  }

  /**
   * Adiciona log da integração
   */
  private static async addLog(
    integrationId: string,
    runId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await supabaseAdmin
      .from('integration_logs')
      .insert({
        integration_id: integrationId,
        run_id: runId,
        level,
        message,
        details: details || null
      })
  }

  /**
   * Remove arquivo do bucket após processamento
   */
  static async cleanupFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from('integration-files')
        .remove([filePath])

      if (error) {
        console.error('Erro ao remover arquivo:', error)
      } else {
        console.log('Arquivo removido do bucket:', filePath)
      }
    } catch (error) {
      console.error('Erro ao limpar arquivo:', error)
    }
  }
}