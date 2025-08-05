// components/integrations/UploadTypeSelector.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  FolderOpen, 
  Zap, 
  Info,
  AlertTriangle
} from "lucide-react"
import { CreateIntegrationData } from "@/types/integrations"
import { Collection } from "@/types/collections"

interface UploadTypeSelectorProps {
  formData: CreateIntegrationData
  onChange: (data: Partial<CreateIntegrationData>) => void
  collections: Collection[]
  disabled?: boolean
}

const UPLOAD_TYPES = [
  {
    value: 'dataset' as const,
    label: 'Dataset Individual',
    description: 'Cada arquivo cria um dataset independente',
    icon: Database,
    color: 'bg-blue-500'
  },
  {
    value: 'collection' as const,
    label: 'Adicionar à Coleção',
    description: 'Arquivos são adicionados a uma coleção existente',
    icon: FolderOpen,
    color: 'bg-green-500'
  },
  {
    value: 'fluid' as const,
    label: 'Upload Fluido',
    description: 'Substitui dados existentes na coleção',
    icon: Zap,
    color: 'bg-orange-500'
  }
]

export function UploadTypeSelector({ 
  formData, 
  onChange, 
  collections, 
  disabled = false 
}: UploadTypeSelectorProps) {
  const handleUploadTypeChange = (uploadType: 'dataset' | 'collection' | 'fluid') => {
    const updates: Partial<CreateIntegrationData> = {
      upload_type: uploadType
    }

    // Limpar configurações específicas ao mudar tipo
    if (uploadType === 'dataset') {
      updates.target_collection_id = ''
      updates.fluid_config = undefined
    } else if (uploadType === 'collection') {
      updates.fluid_config = undefined
    }

    onChange(updates)
  }

  const handleCollectionChange = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    
    onChange({
      target_collection_id: collectionId,
      // Se selecionou coleção fluida, mudar tipo automaticamente
      upload_type: collection?.is_fluid ? 'fluid' : 'collection'
    })
  }

  const handleFluidConfigChange = (key: keyof NonNullable<CreateIntegrationData['fluid_config']>, value: boolean) => {
    onChange({
      fluid_config: {
        ...formData.fluid_config,
        [key]: value
      }
    })
  }

  const selectedCollection = collections.find(c => c.id === formData.target_collection_id)

  return (
    <div className="space-y-6">
      {/* Seleção do Tipo de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Upload</CardTitle>
          <CardDescription>
            Como os arquivos recebidos devem ser processados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {UPLOAD_TYPES.map((type) => {
              const Icon = type.icon
              const isSelected = formData.upload_type === type.value
              
              return (
                <div
                  key={type.value}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !disabled && handleUploadTypeChange(type.value)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Específicas */}
      {formData.upload_type !== 'dataset' && (
        <Card>
          <CardHeader>
            <CardTitle>Coleção de Destino</CardTitle>
            <CardDescription>
              Selecione a coleção onde os arquivos serão processados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-all
                    ${formData.target_collection_id === collection.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !disabled && handleCollectionChange(collection.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        formData.target_collection_id === collection.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{collection.name}</span>
                          {collection.is_fluid && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Fluida
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {collection.dataset_count} datasets • Criada em {new Date(collection.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {collections.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma coleção encontrada</p>
                <p className="text-sm">Crie uma coleção primeiro</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuração do Nome do Dataset */}
      <Card>
        <CardHeader>
          <CardTitle>Nome do Dataset</CardTitle>
          <CardDescription>
            Padrão para nomear os datasets criados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dataset-pattern">Padrão do Nome</Label>
            <Input
              id="dataset-pattern"
              value={formData.dataset_name_pattern || ''}
              onChange={(e) => onChange({ dataset_name_pattern: e.target.value })}
              placeholder="Ex: Vendas_{date} ou Estoque_Atual"
              disabled={disabled}
            />
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p><strong>Variáveis disponíveis:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><code>{'{date}'}</code> - Data atual (ex: 05/08/2025)</li>
                <li><code>{'{datetime}'}</code> - Data e hora (ex: 05/08/2025 14:30:15)</li>
                <li><code>{'{timestamp}'}</code> - Timestamp Unix</li>
                <li><code>{'{filename}'}</code> - Nome do arquivo (sem extensão)</li>
                <li><code>{'{source}'}</code> - Sistema de origem</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Upload Fluido */}
      {formData.upload_type === 'fluid' && selectedCollection?.is_fluid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Configurações de Upload Fluido</span>
            </CardTitle>
            <CardDescription>
              Configure como os dados serão substituídos na coleção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="preserve-schema">Preservar Esquema</Label>
                <p className="text-sm text-muted-foreground">
                  Validar se o arquivo possui a mesma estrutura de colunas
                </p>
              </div>
              <Switch
                id="preserve-schema"
                checked={formData.fluid_config?.preserve_schema || false}
                onCheckedChange={(checked) => handleFluidConfigChange('preserve_schema', checked)}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="backup-previous">Backup da Versão Anterior</Label>
                <p className="text-sm text-muted-foreground">
                  Arquivar dados atuais antes de substituir
                </p>
              </div>
              <Switch
                id="backup-previous"
                checked={formData.fluid_config?.backup_previous || false}
                onCheckedChange={(checked) => handleFluidConfigChange('backup_previous', checked)}
                disabled={disabled}
              />
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Atenção:</strong> Upload fluido substitui permanentemente os dados existentes.
                  {formData.fluid_config?.backup_previous 
                    ? ' A versão atual será arquivada antes da substituição.'
                    : ' Os dados atuais serão perdidos se não fizer backup.'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}