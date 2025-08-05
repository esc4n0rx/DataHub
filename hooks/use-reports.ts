"use client"

import { useState, useCallback } from 'react'
import { ReportsAPI } from '@/lib/reports-api'
import { ExcelExporter } from '@/lib/excel-export'
import { DatasetWithDetails, DatasetFilters, PaginationState } from '@/types/reports'
import { ReportsOverview, ReportsView, ReportsNavigation, CollectionWithStats } from '@/types/reports-enhanced'
import { useToast } from '@/hooks/use-toast'

export function useReports() {
  const [overview, setOverview] = useState<ReportsOverview | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<CollectionWithStats | null>(null)
  const [collectionDatasets, setCollectionDatasets] = useState<DatasetWithDetails[]>([])
  const [selectedDataset, setSelectedDataset] = useState<DatasetWithDetails | null>(null)
  const [currentView, setCurrentView] = useState<ReportsView>({ type: 'overview' })
  const [navigation, setNavigation] = useState<ReportsNavigation>({
    path: [{ type: 'overview', name: 'Relatórios' }]
  })
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

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ReportsAPI.getReportsOverview()
      setOverview(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar visão geral'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const navigateToCollection = useCallback(async (collectionId: string) => {
    try {
      setLoading(true)
      
      const collection = overview?.collections.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Coleção não encontrada')
      }

      const datasets = await ReportsAPI.getCollectionDatasets(collectionId)
      
      setSelectedCollection(collection)
      setCollectionDatasets(datasets)
      setCurrentView({ type: 'collection', collection_id: collectionId })
      setNavigation({
        path: [
          { type: 'overview', name: 'Relatórios' },
          { type: 'collection', id: collectionId, name: collection.name }
        ]
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar coleção'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [overview, toast])

  const navigateToDataset = useCallback(async (datasetId: string) => {
    try {
      setLoading(true)
      
      // Buscar detalhes do dataset
      const dataset = await ReportsAPI.getDatasetDetails(datasetId)
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
      setCurrentView({ type: 'dataset', dataset_id: datasetId })
      
      // Atualizar navegação baseado no contexto atual
      const newPath = [...navigation.path]
      if (currentView.type === 'collection') {
        newPath.push({ type: 'dataset', id: datasetId, name: dataset.name })
      } else {
        // Navegação direta para dataset individual
        newPath.splice(1) // Remove tudo exceto "Relatórios"
        newPath.push({ type: 'dataset', id: datasetId, name: dataset.name })
      }
      
      setNavigation({ path: newPath })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dataset'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [navigation.path, currentView.type, pagination.page, pagination.pageSize, filters.search, filters.column, toast])

  const navigateToOverview = useCallback(() => {
    setCurrentView({ type: 'overview' })
    setSelectedCollection(null)
    setCollectionDatasets([])
    setSelectedDataset(null)
    setNavigation({ path: [{ type: 'overview', name: 'Relatórios' }] })
    setFilters({ search: '', column: null, sortBy: null, sortOrder: 'asc' })
    setPagination({ page: 1, pageSize: 50, total: 0 })
  }, [])

  const navigateBack = useCallback(() => {
    if (currentView.type === 'dataset') {
      if (currentView.collection_id) {
        // Voltar para a coleção
        navigateToCollection(currentView.collection_id)
      } else {
        // Voltar para overview (dataset individual)
        navigateToOverview()
      }
    } else if (currentView.type === 'collection') {
      navigateToOverview()
    }
  }, [currentView, navigateToCollection, navigateToOverview])

  const deleteCollection = useCallback(async (collectionId: string): Promise<boolean> => {
    try {
      setLoading(true)
      await ReportsAPI.deleteCollection(collectionId)
      
      toast({
        title: "Sucesso",
        description: "Coleção excluída com sucesso"
      })
      
      // Recarregar overview
      await loadOverview()
      
      // Se estava visualizando a coleção excluída, voltar para overview
      if (currentView.collection_id === collectionId) {
        navigateToOverview()
      }
      
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir coleção'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, loadOverview, currentView.collection_id, navigateToOverview])

  const deleteDataset = useCallback(async (datasetId: string): Promise<boolean> => {
    try {
      setLoading(true)
      await ReportsAPI.deleteDataset(datasetId)
      
      toast({
        title: "Sucesso",
        description: "Dataset excluído com sucesso"
      })
      
      // Recarregar dados baseado no contexto atual
      if (currentView.type === 'collection' && currentView.collection_id) {
        // Recarregar datasets da coleção
        const datasets = await ReportsAPI.getCollectionDatasets(currentView.collection_id)
        setCollectionDatasets(datasets)
        
        // Atualizar contador na coleção selecionada
        if (selectedCollection) {
          setSelectedCollection({
            ...selectedCollection,
            dataset_count: datasets.length
          })
        }
      } else {
        // Recarregar overview
        await loadOverview()
      }
      
      // Se estava visualizando o dataset excluído, voltar
      if (currentView.dataset_id === datasetId) {
        navigateBack()
      }
      
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir dataset'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, currentView, selectedCollection, loadOverview, navigateBack])

  const refreshCurrentView = useCallback(async () => {
    switch (currentView.type) {
      case 'overview':
        await loadOverview()
        break
      case 'collection':
        if (currentView.collection_id) {
          await navigateToCollection(currentView.collection_id)
        }
        break
      case 'dataset':
        if (currentView.dataset_id) {
          await navigateToDataset(currentView.dataset_id)
        }
        break
    }
  }, [currentView, loadOverview, navigateToCollection, navigateToDataset])

  const updateFilters = useCallback((newFilters: Partial<DatasetFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset page on filter change
  }, [])

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }))
  }, [])

  const exportDataset = useCallback(async (datasetId: string) => {
    try {
      setLoading(true)
      
      // Encontrar o dataset (pode estar em overview.individual_datasets ou collectionDatasets)
      let dataset = overview?.individual_datasets.find(d => d.id === datasetId)
      if (!dataset) {
        dataset = collectionDatasets.find(d => d.id === datasetId)
      }
      
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
  }, [overview, collectionDatasets, toast])

  return {
    // State
    overview,
    selectedCollection,
    collectionDatasets,
    selectedDataset,
    currentView,
    navigation,
    loading,
    filters,
    pagination,
    
    // Actions
    loadOverview,
    navigateToCollection,
    navigateToDataset,
    navigateToOverview,
    navigateBack,
    deleteCollection,
    deleteDataset,
    refreshCurrentView,
    updateFilters,
    updatePagination,
    exportDataset
  }
}