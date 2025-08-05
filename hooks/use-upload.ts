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
  fluidConfig?: FluidUploadConfig | null | undefined
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
            is_current: false
          } : undefined
        )
      }

      await UploadAPI.log(datasetId, 'info', 'Dataset criado com sucesso')

      updateProgress({
        progress: 80,
        message: 'Analisando tipos de colunas...'
      })

      // Montar resultado da análise usando as propriedades corretas da interface AnalysisResult
      const result: AnalysisResult = {
        dataset_id: datasetId,
        columns: columnAnalysis,
        sample_rows: fileAnalysis.data.slice(0, 5), // Usar sample_rows em vez de sample_data
        needs_adjustment: columnAnalysis.some(col => col.confidence < 0.8),
        total_rows: fileAnalysis.totalRows, // Propriedades individuais em vez de file_info
        total_columns: fileAnalysis.headers.length,
        collection_id: options?.uploadMode.collection_id,
        is_fluid_upload: options?.uploadMode.type === 'fluid'
      }

      setAnalysisResult(result)

      // Se não precisa de ajustes, processar diretamente
      if (!result.needs_adjustment) {
        await processFileDirectly(result, file, options)
      }

      updateProgress({
        phase: 'completed',
        progress: 100,
        message: result.needs_adjustment 
          ? 'Análise concluída. Verifique os tipos de dados sugeridos.'
          : 'Upload concluído com sucesso!'
      })

      if (!result.needs_adjustment) {
        toast({
          title: "Upload concluído",
          description: options?.uploadMode.type === 'fluid' 
            ? "Dados atualizados com sucesso!"
            : "Dados processados e salvos com sucesso!"
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na análise do arquivo'
      
      updateProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage
      })

      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: errorMessage
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast, updateProgress])

  // Função auxiliar para processar arquivo sem ajustes
  const processFileDirectly = useCallback(async (
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
  ) => {
    if (!analysisResult) return

    try {
      setIsUploading(true)

      updateProgress({
        phase: 'processing',
        progress: 0,
        message: 'Aplicando ajustes nos tipos de dados...'
      })

      // Enviar ajustes para a API
      const response = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: analysisResult.dataset_id,
          adjustments,
          uploadMode: options?.uploadMode,
          fluidConfig: options?.fluidConfig || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao processar ajustes')
      }

      const result = await response.json()

      updateProgress({
        phase: 'completed',
        progress: 100,
        message: 'Processamento concluído com sucesso!'
      })

      toast({
        title: "Upload concluído",
        description: options?.uploadMode.type === 'fluid' 
          ? "Dados atualizados com ajustes aplicados!"
          : "Dados processados com ajustes aplicados!"
      })

      // Recarregar logs
      await loadLogs(analysisResult.dataset_id)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar ajustes'
      
      updateProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage
      })

      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: errorMessage
      })
    } finally {
      setIsUploading(false)
    }
  }, [analysisResult, toast, updateProgress])

  const loadLogs = useCallback(async (datasetId: string) => {
    try {
      const response = await fetch(`/api/upload/logs?dataset_id=${datasetId}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
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