"use client"

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from './DataTable'
import { DatasetWithDetails, DatasetFilters, PaginationState } from '@/types/reports'
import { ArrowLeft, Download, RefreshCw, Database } from 'lucide-react'

interface DatasetViewerProps {
  dataset: DatasetWithDetails
  filters: DatasetFilters
  pagination: PaginationState
  onFiltersChange: (filters: Partial<DatasetFilters>) => void
  onPaginationChange: (pagination: Partial<PaginationState>) => void
  onRefresh: () => void
  onExport: () => void
  onBack: () => void
  loading?: boolean
}

export function DatasetViewer({
  dataset,
  filters,
  pagination,
  onFiltersChange,
  onPaginationChange,
  onRefresh,
  onExport,
  onBack,
  loading = false
}: DatasetViewerProps) {
  // Recarregar dados quando filtros ou paginação mudarem
  useEffect(() => {
    onRefresh()
  }, [filters.search, filters.column, pagination.page, pagination.pageSize])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Database className="h-5 w-5 text-blue-600" />
                <CardTitle>{dataset.name}</CardTitle>
              </div>
              <CardDescription>
                {dataset.description || 'Visualização e análise dos dados do dataset'}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={onExport} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dataset.total_rows.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total de Registros</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {dataset.total_columns}
              </div>
              <div className="text-xs text-muted-foreground">Colunas</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-orange-600">
                {formatFileSize(dataset.file_size)}
              </div>
              <div className="text-xs text-muted-foreground">Tamanho do Arquivo</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-purple-600">
                {dataset.file_name}
              </div>
              <div className="text-xs text-muted-foreground">Arquivo Original</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-gray-600">
                {formatDate(dataset.created_at)}
              </div>
              <div className="text-xs text-muted-foreground">Data de Criação</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Dataset</CardTitle>
          <CardDescription>
            Visualize, filtre e exporte os dados importados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dataset.columns || !dataset.rows ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <DataTable
              columns={dataset.columns}
              rows={dataset.rows}
              filters={filters}
              pagination={pagination}
              onFiltersChange={onFiltersChange}
              onPaginationChange={onPaginationChange}
              onRefresh={onRefresh}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}