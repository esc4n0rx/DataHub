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
    // Garantir que sempre temos um objeto base válido
    const currentConfig = formData.fluid_config || { preserve_schema: false, backup_previous: false }
    
    onChange({
      fluid_config: {
        preserve_schema: currentConfig.preserve_schema,
        backup_previous: currentConfig.backup_previous,
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
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Coleção de Destino */}
      {(formData.upload_type === 'collection' || formData.upload_type === 'fluid') && (
        <Card>
          <CardHeader>
            <CardTitle>Coleção de Destino</CardTitle>
            <CardDescription>
              {formData.upload_type === 'collection' 
                ? 'Selecione a coleção onde os datasets serão adicionados'
                : 'Selecione a coleção fluida que será atualizada'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Coleção</Label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={formData.target_collection_id}
                onChange={(e) => handleCollectionChange(e.target.value)}
                disabled={disabled}
              >
                <option value="">Selecione uma coleção...</option>
                {collections
                  .filter(c => formData.upload_type === 'fluid' ? c.is_fluid : true)
                  .map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} {collection.is_fluid && '(Fluido)'}
                    </option>
                  ))
                }
              </select>
            </div>

            {selectedCollection && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Informações da Coleção</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Nome:</span>
                    <span className="font-medium text-foreground">{selectedCollection.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <Badge variant={selectedCollection.is_fluid ? "destructive" : "secondary"}>
                      {selectedCollection.is_fluid ? 'Fluido' : 'Normal'}
                    </Badge>
                  </div>
                  {selectedCollection.description && (
                    <div className="mt-2">
                      <span className="text-xs">{selectedCollection.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuração de Padrão de Nome para Dataset Individual */}
      {formData.upload_type === 'dataset' && (
        <Card>
          <CardHeader>
            <CardTitle>Nome do Dataset</CardTitle>
            <CardDescription>
              Padrão para nomear os datasets criados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="dataset-name-pattern">Padrão de Nome</Label>
              <Input
                id="dataset-name-pattern"
                placeholder="Ex: Vendas_{data} ou {arquivo}"
                value={formData.dataset_name_pattern || ''}
                onChange={(e) => onChange({ dataset_name_pattern: e.target.value })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Use {`{data}`} para incluir a data atual, {`{arquivo}`} para o nome do arquivo, ou texto fixo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações do Upload Fluido */}
      {formData.upload_type === 'fluid' && formData.target_collection_id && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Upload Fluido</CardTitle>
            <CardDescription>
              Opções para controlar como os dados são substituídos
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