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
import { CollectionWithStats } from '@/types/reports-enhanced'
import { 
  Folder, 
  Calendar, 
  Database, 
  FileSpreadsheet, 
  TrendingUp, 
  MoreHorizontal,
  Eye,
  Trash2,
  Zap
} from 'lucide-react'

interface CollectionCardProps {
  collection: CollectionWithStats
  onView: (collectionId: string) => void
  onDelete: (collectionId: string) => void
  loading?: boolean
}

export function CollectionCard({ 
  collection, 
  onView, 
  onDelete, 
  loading = false 
}: CollectionCardProps) {
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Nunca'
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

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className={`h-5 w-5 ${collection.is_fluid ? 'text-orange-600' : 'text-blue-600'}`} />
            <span className="truncate">{collection.name}</span>
            {collection.is_fluid && (
              <Zap className="h-4 w-4 text-orange-600" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(collection.category)}>
              {collection.category}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(collection.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(collection.id)}
                  className="text-red-600"
                  disabled={collection.dataset_count > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {collection.description || 'Sem descrição'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Datasets</div>
            <div className="font-bold text-lg">{collection.dataset_count}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Registros</div>
            <div className="font-bold text-lg">{collection.total_records.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Tamanho</div>
            <div className="font-bold text-sm">{formatFileSize(collection.total_size)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Último Upload</div>
            <div className="font-bold text-xs">{formatDate(collection.last_upload)}</div>
          </div>
        </div>

        {/* Dataset Atual (para coleções fluidas) */}
        {collection.is_fluid && collection.current_dataset && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Dataset Atual</span>
              <Badge variant="outline">v{collection.current_dataset.version}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {collection.current_dataset.file_name} • {collection.current_dataset.total_rows.toLocaleString()} registros
            </div>
          </div>
        )}

        <Button 
          onClick={() => onView(collection.id)}
          className="w-full group-hover:bg-primary/90 transition-colors"
          disabled={loading}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Datasets ({collection.dataset_count})
        </Button>
      </CardContent>
    </Card>
  )
}