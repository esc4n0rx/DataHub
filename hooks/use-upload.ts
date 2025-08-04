"use client"

import { useState, useCallback } from 'react'
import { UploadAnalyzer } from '@/lib/upload-analyzer'
import { UploadAPI } from '@/lib/upload-api'
import { AnalysisResult, UploadProgress, DataTypeAdjustment, UploadLog } from '@/types/upload'
import { useToast } from '@/hooks/use-toast'

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

  const analyzeFile = useCallback(async (file: File, datasetName: string): Promise<void> => {
    try {
      setIsUploading(true)
      setLogs([])
      setAnalysisResult(null)
      
      setProgress({
        phase: 'uploading',
        progress: 0,
        message: 'Iniciando upload...'
      })

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

      const datasetId = await UploadAPI.createDataset(
        datasetName,
        file.name,
        file.size,
        fileAnalysis.totalRows,
        fileAnalysis.headers.length
      )

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
        total_columns: fileAnalysis.headers.length
      }

      setAnalysisResult(result)

      if (needsAdjustment) {
        await UploadAPI.updateDatasetStatus(datasetId, 'pending_adjustment')
        updateProgress({
          phase: 'adjusting',
          progress: 80,
          message: 'Aguardando ajustes de tipos de dados...',
          dataset_id: datasetId
        })
      } else {
        // Auto-processar se não precisa de ajuste
        await processDataset(result, file)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      setProgress({
        phase: 'error',
        progress: 0,
        message: errorMessage
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

  const processDataset = useCallback(async (result: AnalysisResult, file: File): Promise<void> => {
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

      // Reprocessar arquivo completo para salvar todos os dados
      const fullFileAnalysis = await UploadAnalyzer.analyzeFile(file)
      await UploadAPI.saveRows(result.dataset_id, fullFileAnalysis.data)

      await UploadAPI.updateDatasetStatus(result.dataset_id, 'confirmed')
      await UploadAPI.log(result.dataset_id, 'info', 'Dataset processado com sucesso')

      updateProgress({
        phase: 'completed',
        progress: 100,
        message: 'Upload concluído com sucesso!'
      })

      toast({
        title: "Upload concluído",
        description: "Dados processados e salvos com sucesso!"
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
    file: File
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
      await processDataset(analysisResult, file)

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