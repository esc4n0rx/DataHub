"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReports } from "@/hooks/use-reports"
import { CollectionCard } from "./reports/CollectionCard"
import { DatasetCard } from "./reports/DatasetCard"
import { CollectionView } from "./reports/CollectionView"
import { DatasetViewer } from "./reports/DatasetViewer"
import { ReportsNavigation } from "./reports/ReportsNavigation"
import { DeleteConfirmDialog } from "./reports/DeleteConfirmDialog"
import { 
  FileText, 
  Database, 
  TrendingUp, 
  RefreshCw, 
  Folder, 
  FileSpreadsheet,
  Zap
} from "lucide-react"

export function ReportsContent() {
  const {
    overview,
    selectedCollection,
    collectionDatasets,
    selectedDataset,
    currentView,
    navigation,
    loading,
    filters,
    pagination,
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
  } = useReports()

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: 'collection' | 'dataset'
    id: string
    name: string
  } | null>(null)

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const handleDeleteClick = (type: 'collection' | 'dataset', id: string, name: string) => {
    setDeleteDialog({ isOpen: true, type, id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return

    const success = deleteDialog.type === 'collection' 
      ? await deleteCollection(deleteDialog.id)
      : await deleteDataset(deleteDialog.id)

    if (success) {
      setDeleteDialog(null)
    }
  }

  const handleNavigation = (type: 'overview' | 'collection' | 'dataset', id?: string) => {
    switch (type) {
      case 'overview':
        navigateToOverview()
        break
      case 'collection':
        if (id) navigateToCollection(id)
        break
      case 'dataset':
        if (id) navigateToDataset(id)
        break
    }
  }

  // Renderizar Dataset Viewer
  if (currentView.type === 'dataset' && selectedDataset) {
    return (
      <div className="p-6">
        <ReportsNavigation navigation={navigation} onNavigate={handleNavigation} />
        <DatasetViewer
          dataset={selectedDataset}
          filters={filters}
          pagination={pagination}
          onFiltersChange={updateFilters}
          onPaginationChange={updatePagination}
          onRefresh={refreshCurrentView}
          onExport={() => exportDataset(selectedDataset.id)}
          onBack={navigateBack}
          loading={loading}
        />
      </div>
    )
  }

  // Renderizar Collection View
  if (currentView.type === 'collection' && selectedCollection) {
    return (
      <div className="p-6">
        <ReportsNavigation navigation={navigation} onNavigate={handleNavigation} />
        <CollectionView
          collection={selectedCollection}
          datasets={collectionDatasets}
          onBack={navigateBack}
          onViewDataset={navigateToDataset}
          onExportDataset={exportDataset}
          onDeleteDataset={(id) => {
            const dataset = collectionDatasets.find(d => d.id === id)
            if (dataset) {
              handleDeleteClick('dataset', id, dataset.name)
            }
          }}
          loading={loading}
        />
      </div>
    )
  }

  // Renderizar Overview
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize, analise e exporte os dados organizados em coleções e datasets individuais
          </p>
        </div>
        <Button variant="outline" onClick={refreshCurrentView} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coleções</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total_stats.total_collections}</div>
              <p className="text-xs text-muted-foreground">
                {overview.collections.filter(c => c.is_fluid).length} fluidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Datasets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total_stats.total_datasets}</div>
              <p className="text-xs text-muted-foreground">
                {overview.individual_datasets.length} individuais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total_stats.total_records.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registros importados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(overview.total_stats.total_size)}</div>
              <p className="text-xs text-muted-foreground">Dados armazenados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coleções */}
      {overview && overview.collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Folder className="h-5 w-5" />
              <span>Coleções</span>
              <Badge variant="secondary">{overview.collections.length}</Badge>
            </CardTitle>
            <CardDescription>
              Datasets organizados por categoria e propósito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {overview.collections.map((collection, index) => (
                <div 
                  key={collection.id}
                  className="animate-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CollectionCard
                    collection={collection}
                    onView={navigateToCollection}
                    onDelete={(id) => handleDeleteClick('collection', id, collection.name)}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datasets Individuais */}
      {overview && overview.individual_datasets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Datasets Individuais</span>
              <Badge variant="secondary">{overview.individual_datasets.length}</Badge>
            </CardTitle>
            <CardDescription>
              Datasets independentes não organizados em coleções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {overview.individual_datasets.map((dataset, index) => (
                <div 
                  key={dataset.id}
                  className="animate-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${(overview.collections.length + index) * 100}ms` }}
                >
                  <DatasetCard
                    dataset={dataset}
                    onView={navigateToDataset}
                    onExport={exportDataset}
                    onDelete={(id) => handleDeleteClick('dataset', id, dataset.name)}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {overview && overview.collections.length === 0 && overview.individual_datasets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Você ainda não possui coleções ou datasets. Faça upload de arquivos na seção 
              "Upload de Dados" para começar a organizar seus dados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        isOpen={deleteDialog?.isOpen || false}
        onClose={() => setDeleteDialog(null)}
       onConfirm={handleDeleteConfirm}
       title={`Excluir ${deleteDialog?.type === 'collection' ? 'Coleção' : 'Dataset'}`}
       description={
         deleteDialog?.type === 'collection'
           ? `Tem certeza que deseja excluir a coleção "${deleteDialog.name}"? Esta ação não pode ser desfeita. Certifique-se de que não há datasets nesta coleção.`
           : `Tem certeza que deseja excluir o dataset "${deleteDialog?.name}"? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.`
       }
       confirmText="Excluir"
       isDestructive={true}
     />
   </div>
 )
}