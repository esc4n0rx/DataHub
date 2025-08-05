"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatasetCard } from './DatasetCard'
import { CollectionWithStats } from '@/types/reports-enhanced'
import { DatasetWithDetails } from '@/types/reports'
import { ArrowLeft, Folder, Zap, Database, FileSpreadsheet, Calendar } from 'lucide-react'

interface CollectionViewProps {
  collection: CollectionWithStats
  datasets: DatasetWithDetails[]
  onBack: () => void
  onViewDataset: (datasetId: string) => void
  onExportDataset: (datasetId: string) => void
  onDeleteDataset: (datasetId: string) => void
  loading?: boolean
}

export function CollectionView({
  collection,
  datasets,
  onBack,
  onViewDataset,
  onExportDataset,
  onDeleteDataset,
  loading = false
}: CollectionViewProps) {
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string): string => {
    const colors = {
      general: 'bg-gray-100 text-gray-700',
      sales: 'bg-green-100 text-green-700',
      inventory: 'bg-blue-100 text-blue-700',
      customers: 'bg-purple-100 text-purple-700',
      financial: 'bg-yellow-100 text-yellow-700',
      operations: 'bg-orange-100 text-orange-700'
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  const sortedDatasets = [...datasets].sort((a, b) => {
    // Primeiro, datasets atuais (para coleções fluidas)
    if ('is_current' in a && 'is_current' in b) {
      if (a.is_current && !b.is_current) return -1
      if (!a.is_current && b.is_current) return 1
    }
    
    // Depois, por versão (mais recente primeiro)
    if ('version' in a && 'version' in b) {
      const versionA = typeof a.version === 'number' ? a.version : 0
      const versionB = typeof b.version === 'number' ? b.version : 0
      return versionB - versionA
    }
    
    // Por último, por data de criação
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header da Coleção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <div className="flex items-center space-x-2">
                  <Folder className={`h-5 w-5 ${collection.is_fluid ? 'text-orange-600' : 'text-blue-600'}`} />
                  <CardTitle className="flex items-center space-x-2">
                    <span>{collection.name}</span>
                    {collection.is_fluid && (
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-orange-600" />
                        <Badge className="bg-orange-600">Fluido</Badge>
                      </div>
                    )}
                  </CardTitle>
                </div>
              </div>
              <CardDescription>
                {collection.description || 'Visualização dos datasets desta coleção'}
              </CardDescription>
            </div>
            <Badge className={getCategoryColor(collection.category)}>
              {collection.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {collection.dataset_count}
              </div>
              <div className="text-xs text-muted-foreground">Total de Datasets</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {collection.total_records.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total de Registros</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-orange-600">
                {formatFileSize(collection.total_size)}
              </div>
              <div className="text-xs text-muted-foreground">Tamanho Total</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-purple-600">
                {collection.last_upload ? formatDate(collection.last_upload) : 'Nunca'}
              </div>
              <div className="text-xs text-muted-foreground">Último Upload</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-bold text-gray-600">
                {formatDate(collection.created_at)}
              </div>
              <div className="text-xs text-muted-foreground">Criado em</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Datasets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Datasets da Coleção</span>
          </CardTitle>
          <CardDescription>
            {collection.is_fluid 
              ? 'Histórico de versões - apenas a versão atual é utilizada nos relatórios'
              : 'Todos os datasets desta coleção organizados por data de upload'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-16">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum dataset encontrado</h3>
              <p className="text-muted-foreground">
                Esta coleção ainda não possui datasets. Faça upload de arquivos para começar.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedDatasets.map((dataset, index) => (
                <div 
                  key={dataset.id} 
                  className="animate-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <DatasetCard
                    dataset={dataset}
                    onView={onViewDataset}
                    onExport={onExportDataset}
                    onDelete={onDeleteDataset}
                    isFluid={collection.is_fluid}
                    version={'version' in dataset && typeof dataset.version === 'number' ? dataset.version : undefined}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}