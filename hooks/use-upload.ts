"use client"

import { useState, useCallback } from 'react'
import { UploadAnalyzer } from '@/lib/upload-analyzer'
import { UploadAPI } from '@/lib/upload-api'
import { CollectionsAPI } from '@/lib/collections-api'
import { AnalysisResult, UploadProgress, DataTypeAdjustment, UploadLog } from '@/types/upload'
import { UploadMode, FluidUploadConfig } from '@/types/collections'
import { useToast } from '@/hooks/use-toast'

interface UploadOptions {
  uploadMode: UploadMode
  fluidConfig?: FluidUploadConfig
}

export function useUpload() {
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [logs, setLogs] = useState<UploadLog[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const updateProgress = useCallback((update: Partial<UploadProgress>) => {
    setProgress(prev => prev ? { ...prev, ...update } : null)
  }, [])

  const addLog = useCallback((log: UploadLog) => {
    setLogs(prev => [...prev, log])
  }, [])

  const analyzeFile = useCallback(async (
    file: File, 
    datasetName: string, 
    options?: UploadOptions
  ): Promise<void> => {
    try {
      setIsUploading(true)
      setLogs([])
      setAnalysisResult(null)
      
      setProgress({
        phase: 'uploading',
        progress: 0,
        message: 'Iniciando upload...',
        collection_id: options?.uploadMode.collection_id
      })

      // Para upload fluido, verificar compatibilidade de esquema
      if (options?.uploadMode.type === 'fluid' && options?.uploadMode.collection_id) {
        updateProgress({
          progress: 10,
          message: 'Verificando compatibilidade com dados existentes...'
        })

        const currentDataset = await CollectionsAPI.getCurrentDataset(options.uploadMode.collection_id)
        if (currentDataset && options.fluidConfig?.preserve_schema) {
          // Aqui você pode adicionar lógica para verificar se o esquema é compatível
          updateProgress({
            progress: 15,
            message: 'Esquema compatível verificado'
          })
        }
      }

      // Análise do arquivo
      updateProgress({
        phase: 'analyzing',
        progress: 20,
        message: 'Analisando arquivo...'
      })

      const fileAnalysis = await UploadAnalyzer.analyzeFile(file)
      
      updateProgress({
        progress: 40,
        message: 'Analisando tipos de dados...'
      })

      const columnAnalysis = UploadAnalyzer.analyzeColumns(
        fileAnalysis.headers,
        fileAnalysis.data
      )

      // Criar dataset no banco
      updateProgress({
        progress: 60,
        message: 'Criando dataset...'
      })

      let datasetId: string

      if (options?.uploadMode.type === 'fluid' && options.uploadMode.collection_id) {
        // Para upload fluido, arquivar versão anterior se necessário
        if (options.fluidConfig?.backup_previous) {
          await CollectionsAPI.archivePreviousVersion(options.uploadMode.collection_id)
        }

        // Criar novo dataset como versão atual
        const currentVersion = await CollectionsAPI.getCurrentDataset(options.uploadMode.collection_id)
        datasetId = await UploadAPI.createDataset(
          datasetName,
          file.name,
          file.size,
          fileAnalysis.totalRows,
          fileAnalysis.headers.length,
          undefined, // description
          {
            collection_id: options.uploadMode.collection_id,
            is_current: true,
            version: (currentVersion?.version || 0) + 1
          }
        )
      } else {
        // Upload normal ou em coleção
        datasetId = await UploadAPI.createDataset(
          datasetName,
          file.name,
          file.size,
          fileAnalysis.totalRows,
          fileAnalysis.headers.length,
          undefined, // description
          options?.uploadMode.collection_id ? {
            collection_id: options.uploadMode.collection_id,
            is_current: false, // Para coleções normais, não há conceito de "atual"
            version: 1
          } : undefined
        )
      }

      await UploadAPI.log(datasetId, 'info', 'Dataset criado com sucesso')

      // Verificar se precisa de ajuste
      const needsAdjustment = columnAnalysis.some(col => 
        col.confidence < 0.8 || col.issues.length > 0
      )

      const issues = UploadAnalyzer.validateDataIntegrity(columnAnalysis, fileAnalysis.data)
      
      if (issues.length > 0) {
        for (const issue of issues) {
          await UploadAPI.log(datasetId, 'warning', issue)
        }
      }

      const result: AnalysisResult = {
        dataset_id: datasetId,
        columns: columnAnalysis,
        sample_rows: fileAnalysis.data.slice(0, 5),
        needs_adjustment: needsAdjustment,
        total_rows: fileAnalysis.totalRows,
        total_columns: fileAnalysis.headers.length,
        collection_id: options?.uploadMode.collection_id,
        is_fluid_upload: options?.uploadMode.type === 'fluid'
      }

      setAnalysisResult(result)

      if (needsAdjustment) {
        await UploadAPI.updateDatasetStatus(datasetId, 'pending_adjustment')
        updateProgress({
          phase: 'adjusting',
          progress: 80,
          message: 'Aguardando ajustes de tipos de dados...',
          dataset_id: datasetId,
          collection_id: options?.uploadMode.collection_id
        })
      } else {
        // Auto-processar se não precisa de ajuste
        await processDataset(result, file, options)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      setProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage,
        collection_id: options?.uploadMode.collection_id
      })

      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: errorMessage
      })

      if (analysisResult?.dataset_id) {
        await UploadAPI.log(analysisResult.dataset_id, 'error', errorMessage)
        await UploadAPI.updateDatasetStatus(analysisResult.dataset_id, 'error')
      }
    } finally {
      setIsUploading(false)
    }
  }, [toast, analysisResult?.dataset_id, updateProgress])

  const processDataset = useCallback(async (
    result: AnalysisResult, 
    file: File, 
    options?: UploadOptions
  ): Promise<void> => {
    try {
      updateProgress({
        phase: 'processing',
        progress: 85,
        message: 'Salvando configurações de colunas...'
      })

      // Salvar colunas
      await UploadAPI.saveColumns(
        result.dataset_id,
        result.columns.map(col => ({
          name: col.name,
          index: col.index,
          data_type: col.suggested_type,
          is_required: false,
          sample_values: col.sample_values
        }))
      )

      await UploadAPI.log(result.dataset_id, 'info', 'Configurações de colunas salvas')

      updateProgress({
        progress: 90,
        message: 'Processando dados completos...'
      })

      // Para upload fluido, limpar dados anteriores se não foi feito backup
      if (options?.uploadMode.type === 'fluid' && 
          options.uploadMode.collection_id && 
          !options.fluidConfig?.backup_previous) {
        
        // Remover dados da versão anterior
        await UploadAPI.clearCollectionData(options.uploadMode.collection_id)
        await UploadAPI.log(result.dataset_id, 'info', 'Dados anteriores removidos (upload fluido)')
      }

      // Reprocessar arquivo completo para salvar todos os dados
      const fullFileAnalysis = await UploadAnalyzer.analyzeFile(file)
      await UploadAPI.saveRows(result.dataset_id, fullFileAnalysis.data)

      await UploadAPI.updateDatasetStatus(result.dataset_id, 'confirmed')
      
      const successMessage = options?.uploadMode.type === 'fluid' 
        ? 'Dados atualizados com sucesso (upload fluido)'
        : 'Dataset processado com sucesso'
      
      await UploadAPI.log(result.dataset_id, 'info', successMessage)

      updateProgress({
        phase: 'completed',
        progress: 100,
        message: 'Upload concluído com sucesso!'
      })

      toast({
        title: "Upload concluído",
        description: options?.uploadMode.type === 'fluid' 
          ? "Dados atualizados com sucesso!"
          : "Dados processados e salvos com sucesso!"
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no processamento'
      
      updateProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage
      })

      await UploadAPI.log(result.dataset_id, 'error', errorMessage)
      await UploadAPI.updateDatasetStatus(result.dataset_id, 'error')

      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: errorMessage
      })
    }
  }, [toast, updateProgress])

  const confirmWithAdjustments = useCallback(async (
    adjustments: DataTypeAdjustment[],
    file: File,
    options?: UploadOptions
  ): Promise<void> => {
    if (!analysisResult) return

    try {
      updateProgress({
        phase: 'processing',
        progress: 85,
        message: 'Aplicando ajustes...'
      })

      // Aplicar ajustes
      await UploadAPI.updateColumns(analysisResult.dataset_id, adjustments)
      await UploadAPI.log(analysisResult.dataset_id, 'info', 'Ajustes de tipos aplicados')

      // Processar com as configurações ajustadas
      await processDataset(analysisResult, file, options)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aplicar ajustes'
      
      updateProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage
      })

      toast({
        variant: "destructive",
        title: "Erro nos ajustes",
        description: errorMessage
      })

      await UploadAPI.log(analysisResult.dataset_id, 'error', errorMessage)
      await UploadAPI.updateDatasetStatus(analysisResult.dataset_id, 'error')
    }
  }, [analysisResult, processDataset, toast, updateProgress])

  const loadLogs = useCallback(async (datasetId: string): Promise<void> => {
    try {
      const logsData = await UploadAPI.getLogs(datasetId)
      setLogs(logsData)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }, [])

  const reset = useCallback(() => {
    setProgress(null)
    setAnalysisResult(null)
    setLogs([])
    setIsUploading(false)
  }, [])

  return {
    progress,
    analysisResult,
    logs,
    isUploading,
    analyzeFile,
    confirmWithAdjustments,
    loadLogs,
    reset
  }
}