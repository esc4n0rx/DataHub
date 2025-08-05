"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CollectionDataset, FluidUploadConfig } from '@/types/collections'
import { CollectionsAPI } from '@/lib/collections-api'
import { Zap, AlertTriangle, Shield, Clock } from 'lucide-react'

interface FluidUploadModeProps {
  collectionId: string
  onConfigChange: (config: FluidUploadConfig) => void
  disabled?: boolean
}

export function FluidUploadMode({ collectionId, onConfigChange, disabled = false }: FluidUploadModeProps) {
  const [currentDataset, setCurrentDataset] = useState<CollectionDataset | null>(null)
  const [config, setConfig] = useState<FluidUploadConfig>({
    collection_id: collectionId,
    preserve_schema: true,
    backup_previous: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCurrentDataset = async () => {
      try {
        setLoading(true)
        const dataset = await CollectionsAPI.getCurrentDataset(collectionId)
        setCurrentDataset(dataset)
      } catch (error) {
        console.error('Erro ao carregar dataset atual:', error)
      } finally {
        setLoading(false)
      }
    }

    if (collectionId) {
      loadCurrentDataset()
    }
  }, [collectionId])

  useEffect(() => {
    onConfigChange(config)
  }, [config, onConfigChange])

  const updateConfig = (updates: Partial<FluidUploadConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <span>Upload Fluido</span>
            <Badge className="bg-orange-600">Ativo</Badge>
          </CardTitle>
          <CardDescription>
            Configurações para atualização de dados em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status do Dataset Atual */}
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ) : currentDataset ? (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Dataset Atual</div>
                <Badge variant="outline">v{currentDataset.version}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Arquivo:</span> {currentDataset.file_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Registros:</span> {currentDataset.total_rows.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho:</span> {formatFileSize(currentDataset.file_size)}
                </div>
                <div>
                  <span className="text-muted-foreground">Última atualização:</span> {formatDate(currentDataset.updated_at)}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta coleção ainda não possui dados. O primeiro upload criará o dataset base.
              </AlertDescription>
            </Alert>
          )}

          {/* Configurações do Upload Fluido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <Label>Preservar Esquema</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verificar se o novo arquivo tem a mesma estrutura de colunas
                </p>
              </div>
              <Switch
                checked={config.preserve_schema}
                onCheckedChange={(checked) => updateConfig({ preserve_schema: checked })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <Label>Backup da Versão Anterior</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manter uma cópia dos dados anteriores como backup
                </p>
              </div>
              <Switch
                checked={config.backup_previous}
                onCheckedChange={(checked) => updateConfig({ backup_previous: checked })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Avisos Importantes */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> O upload fluido irá {config.backup_previous ? 'arquivar' : 'substituir'} os dados atuais. 
              {!config.backup_previous && ' Esta ação não pode ser desfeita.'}
              {config.preserve_schema && ' O arquivo deve ter exatamente as mesmas colunas do dataset atual.'}
            </AlertDescription>
          </Alert>

          {/* Estatísticas de Impacto */}
          {currentDataset && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {currentDataset.total_rows.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Registros que serão {config.backup_previous ? 'arquivados' : 'substituídos'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {currentDataset.total_columns}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Colunas na estrutura atual
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  v{(currentDataset.version || 0) + 1}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Nova versão que será criada
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}