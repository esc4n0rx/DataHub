"use client"

import { useState, useCallback } from 'react'
import { ReportsAPI } from '@/lib/reports-api'
import { ExcelExporter } from '@/lib/excel-export'
import { DatasetWithDetails, DatasetFilters, PaginationState } from '@/types/reports'
import { useToast } from '@/hooks/use-toast'

export function useReports() {
  const [datasets, setDatasets] = useState<DatasetWithDetails[]>([])
  const [selectedDataset, setSelectedDataset] = useState<DatasetWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<DatasetFilters>({
    search: '',
    column: null,
    sortBy: null,
    sortOrder: 'asc'
  })
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,
    total: 0
  })
  const { toast } = useToast()

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ReportsAPI.getDatasets()
      setDatasets(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar datasets'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadDatasetData = useCallback(async (datasetId: string) => {
    try {
      setLoading(true)
      
      // Buscar detalhes do dataset
      const dataset = datasets.find(d => d.id === datasetId)
      if (!dataset) {
        throw new Error('Dataset não encontrado')
      }

      // Buscar colunas
      const columns = await ReportsAPI.getDatasetColumns(datasetId)
      
      // Buscar dados com paginação
      const { rows, total } = await ReportsAPI.getDatasetRows(
        datasetId,
        pagination.page,
        pagination.pageSize,
        filters.search || undefined,
        filters.column || undefined
      )

      const datasetWithDetails: DatasetWithDetails = {
        ...dataset,
        columns,
        rows
      }

      setSelectedDataset(datasetWithDetails)
      setPagination(prev => ({ ...prev, total }))

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [datasets, pagination.page, pagination.pageSize, filters.search, filters.column, toast])

  const refreshData = useCallback(async () => {
    if (selectedDataset) {
      await loadDatasetData(selectedDataset.id)
    }
  }, [selectedDataset, loadDatasetData])

  const updateFilters = useCallback((newFilters: Partial<DatasetFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset page on filter change
  }, [])

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }))
  }, [])

  const exportToExcel = useCallback(async (datasetId: string) => {
    try {
      setLoading(true)
      
      const dataset = datasets.find(d => d.id === datasetId)
      if (!dataset) {
        throw new Error('Dataset não encontrado')
      }

      toast({
        title: "Preparando export",
        description: "Carregando todos os dados..."
      })

      // Buscar todos os dados
      const [columns, allRows] = await Promise.all([
        ReportsAPI.getDatasetColumns(datasetId),
        ReportsAPI.getAllDatasetRows(datasetId)
      ])

      // Exportar
      await ExcelExporter.exportDataset(dataset.name, columns, allRows)

      toast({
        title: "Export concluído",
        description: `${allRows.length} registros exportados com sucesso`
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao exportar dados'
      toast({
        variant: "destructive",
        title: "Erro no export",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [datasets, toast])

  const clearSelection = useCallback(() => {
    setSelectedDataset(null)
    setFilters({
      search: '',
      column: null,
      sortBy: null,
      sortOrder: 'asc'
    })
    setPagination({
      page: 1,
      pageSize: 50,
      total: 0
    })
  }, [])

  return {
    datasets,
    selectedDataset,
    loading,
    filters,
    pagination,
    loadDatasets,
    loadDatasetData,
    refreshData,
    updateFilters,
    updatePagination,
    exportToExcel,
    clearSelection
  }
}