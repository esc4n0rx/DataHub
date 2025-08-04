"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatasetWithDetails } from '@/types/reports'
import { Database, Calendar, FileSpreadsheet, Download, Eye } from 'lucide-react'

interface DatasetListProps {
  datasets: DatasetWithDetails[]
  onSelectDataset: (datasetId: string) => void
  onExportDataset: (datasetId: string) => void
  loading?: boolean
}

export function DatasetList({ 
  datasets, 
  onSelectDataset, 
  onExportDataset, 
  loading = false 
}: DatasetListProps) {
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum dataset encontrado</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Você ainda não possui datasets confirmados. Faça upload de arquivos na seção 
            "Upload de Dados" para visualizá-los aqui.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {datasets.map((dataset) => (
        <Card key={dataset.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <span>{dataset.name}</span>
              </div>
              <Badge variant="secondary">
                {dataset.total_rows.toLocaleString()} registros
              </Badge>
            </CardTitle>
            <CardDescription>
              {dataset.description || 'Sem descrição'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Arquivo</div>
                <div className="font-medium">{dataset.file_name}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Tamanho</div>
                <div className="font-medium">{formatFileSize(dataset.file_size)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Colunas</div>
                <div className="font-medium">{dataset.total_columns}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Criado em</div>
                <div className="font-medium text-xs">{formatDate(dataset.created_at)}</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => onSelectDataset(dataset.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Dados
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onExportDataset(dataset.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}