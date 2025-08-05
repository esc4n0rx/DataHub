"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DatasetWithDetails } from '@/types/reports'
import { IndividualDataset } from '@/types/reports-enhanced'
import { 
  FileSpreadsheet, 
  Calendar, 
  Database, 
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Zap
} from 'lucide-react'

interface DatasetCardProps {
  dataset: DatasetWithDetails | IndividualDataset
  onView: (datasetId: string) => void
  onExport: (datasetId: string) => void
  onDelete: (datasetId: string) => void
  isFluid?: boolean
  version?: number
  loading?: boolean
}

export function DatasetCard({ 
  dataset, 
  onView, 
  onExport, 
  onDelete, 
  isFluid = false,
  version,
  loading = false 
}: DatasetCardProps) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600">Confirmado</Badge>
      case 'analyzing':
        return <Badge className="bg-blue-600">Analisando</Badge>
      case 'pending_adjustment':
        return <Badge className="bg-yellow-600">Pendente</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isCurrentVersion = 'is_current' in dataset && dataset.is_current

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 group hover:scale-[1.01] ${
      isCurrentVersion ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className={`h-5 w-5 ${isFluid ? 'text-orange-600' : 'text-blue-600'}`} />
            <span className="truncate">{dataset.name}</span>
            {isFluid && <Zap className="h-4 w-4 text-orange-600" />}
            {version && (
              <Badge variant="outline" className={isCurrentVersion ? 'border-orange-600 text-orange-600' : ''}>
                v{version}
              </Badge>
            )}
            {isCurrentVersion && (
              <Badge className="bg-orange-600">Atual</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(dataset.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(dataset.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Dados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(dataset.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(dataset.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Dataset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {dataset.description || `Arquivo: ${dataset.file_name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Registros</div>
            <div className="font-bold text-lg">{dataset.total_rows.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Colunas</div>
            <div className="font-bold text-lg">{dataset.total_columns}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Tamanho</div>
            <div className="font-bold text-sm">{formatFileSize(dataset.file_size)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Criado em</div>
            <div className="font-bold text-xs">{formatDate(dataset.created_at)}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted rounded">
          <strong>Arquivo:</strong> {dataset.file_name}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={() => onView(dataset.id)}
            className="flex-1"
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExport(dataset.id)}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}