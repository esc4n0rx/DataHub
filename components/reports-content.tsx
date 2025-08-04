"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useReports } from "@/hooks/use-reports"
import { DatasetList } from "./reports/DatasetList"
import { DatasetViewer } from "./reports/DatasetViewer"
import { FileText, Database, TrendingUp, Download } from "lucide-react"

export function ReportsContent() {
  const {
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
  } = useReports()

  // Carregar datasets ao montar o componente
  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  const handleSelectDataset = async (datasetId: string) => {
    await loadDatasetData(datasetId)
  }

  const handleExportDataset = async (datasetId: string) => {
    await exportToExcel(datasetId)
  }

  const handleBackToList = () => {
    clearSelection()
  }

  // Estatísticas dos datasets
  const totalRecords = datasets.reduce((sum, dataset) => sum + dataset.total_rows, 0)
  const totalSize = datasets.reduce((sum, dataset) => sum + dataset.file_size, 0)
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  if (selectedDataset) {
    return (
      <div className="p-6">
        <DatasetViewer
          dataset={selectedDataset}
          filters={filters}
          pagination={pagination}
          onFiltersChange={updateFilters}
          onPaginationChange={updatePagination}
          onRefresh={refreshData}
          onExport={() => exportToExcel(selectedDataset.id)}
          onBack={handleBackToList}
          loading={loading}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize, analise e exporte os dados dos seus datasets importados
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-xs text-muted-foreground">Datasets confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros importados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">Espaço utilizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadDatasets} 
              disabled={loading}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Atualizar Lista
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datasets Disponíveis</CardTitle>
          <CardDescription>
            Clique em um dataset para visualizar e analisar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatasetList
            datasets={datasets}
            onSelectDataset={handleSelectDataset}
            onExportDataset={handleExportDataset}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}