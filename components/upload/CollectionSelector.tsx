"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Collection, CreateCollectionData, UploadMode } from '@/types/collections'
import { CollectionsAPI } from '@/lib/collections-api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Database, RefreshCw, Folder, Zap } from 'lucide-react'

interface CollectionSelectorProps {
  selectedMode: UploadMode
  onModeChange: (mode: UploadMode) => void
  disabled?: boolean
}

export function CollectionSelector({ selectedMode, onModeChange, disabled = false }: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const { toast } = useToast()

  const [newCollection, setNewCollection] = useState<CreateCollectionData>({
    name: '',
    description: '',
    category: 'general',
    is_fluid: false
  })

  const loadCollections = async () => {
    try {
      setLoading(true)
      const data = await CollectionsAPI.getCollections()
      setCollections(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao carregar coleções'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  const handleCreateCollection = async () => {
    try {
      setCreateLoading(true)
      
      if (!newCollection.name.trim()) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Nome da coleção é obrigatório"
        })
        return
      }

      const id = await CollectionsAPI.createCollection(newCollection)
      
      toast({
        title: "Sucesso",
        description: "Coleção criada com sucesso"
      })

      setShowCreateDialog(false)
      setNewCollection({
        name: '',
        description: '',
        category: 'general',
        is_fluid: false
      })
      
      await loadCollections()
      
      // Auto-selecionar a nova coleção
      onModeChange({
        type: newCollection.is_fluid ? 'fluid' : 'collection',
        collection_id: id
      })

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao criar coleção'
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleModeChange = (type: 'individual' | 'collection' | 'fluid') => {
    if (type === 'individual') {
      onModeChange({ type: 'individual' })
    } else {
      // Manter coleção selecionada se houver
      onModeChange({
        type,
        collection_id: selectedMode.collection_id
      })
    }
  }

  const handleCollectionChange = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    if (collection) {
      onModeChange({
        type: collection.is_fluid ? 'fluid' : 'collection',
        collection_id: collectionId
      })
    }
  }

  const selectedCollection = collections.find(c => c.id === selectedMode.collection_id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Modo de Upload</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção do Tipo de Upload */}
        <div className="space-y-3">
          <Label>Tipo de Upload</Label>
          <div className="grid gap-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMode.type === 'individual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => !disabled && handleModeChange('individual')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedMode.type === 'individual' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">Upload Individual</div>
                  <div className="text-sm text-muted-foreground">
                    Criar um novo dataset independente
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMode.type === 'collection' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => !disabled && handleModeChange('collection')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedMode.type === 'collection' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4" />
                    <div className="font-medium">Upload em Coleção</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Adicionar à uma coleção existente (mantém histórico)
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMode.type === 'fluid' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => !disabled && handleModeChange('fluid')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedMode.type === 'fluid' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <div className="font-medium">Upload Fluido</div>
                    <Badge className="bg-orange-600">Sobrescreve</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Atualizar dados existentes (para dashboards em tempo real)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Coleção */}
        {(selectedMode.type === 'collection' || selectedMode.type === 'fluid') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Coleção</Label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadCollections}
                  disabled={loading || disabled}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={disabled}>
                      <Plus className="h-4 w-4 mr-1" />
                      Nova
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Coleção</DialogTitle>
                      <DialogDescription>
                        Organize seus uploads em coleções para melhor gestão dos dados
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="collection-name">Nome *</Label>
                        <Input
                          id="collection-name"
                          placeholder="Ex: Vendas, Estoque, Clientes..."
                          value={newCollection.name}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collection-category">Categoria</Label>
                        <Select 
                          value={newCollection.category} 
                          onValueChange={(value) => setNewCollection(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Geral</SelectItem>
                            <SelectItem value="sales">Vendas</SelectItem>
                            <SelectItem value="inventory">Estoque</SelectItem>
                            <SelectItem value="customers">Clientes</SelectItem>
                            <SelectItem value="financial">Financeiro</SelectItem>
                            <SelectItem value="operations">Operações</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collection-description">Descrição</Label>
                        <Textarea
                          id="collection-description"
                          placeholder="Descreva o propósito desta coleção..."
                          value={newCollection.description}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newCollection.is_fluid}
                          onCheckedChange={(checked) => setNewCollection(prev => ({ ...prev, is_fluid: checked }))}
                        />
                        <div className="space-y-0.5">
                          <Label>Upload Fluido</Label>
                          <p className="text-xs text-muted-foreground">
                            Novos uploads sobrescrevem dados anteriores
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateCollection} disabled={createLoading}>
                        {createLoading ? 'Criando...' : 'Criar Coleção'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Select
              value={selectedMode.collection_id || ''}
              onValueChange={handleCollectionChange}
              disabled={loading || disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma coleção..." />
              </SelectTrigger>
              <SelectContent>
                {collections
                  .filter(c => selectedMode.type === 'fluid' ? c.is_fluid : !c.is_fluid)
                  .map(collection => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <div className="flex items-center space-x-2">
                        <span>{collection.name}</span>
                        {collection.is_fluid && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700">
                            Fluido
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedCollection && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{selectedCollection.name}</div>
                {selectedCollection.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCollection.description}
                  </div>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {selectedCollection.dataset_count} datasets
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedCollection.category}
                  </Badge>
                  {selectedCollection.is_fluid && (
                    <Badge className="bg-orange-600 text-xs">
                      Fluido
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informações sobre o modo selecionado */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm">
            {selectedMode.type === 'individual' && (
<>
<strong>Upload Individual:</strong> Cada arquivo será processado como um dataset independente, mantendo histórico completo.
</>
)}
{selectedMode.type === 'collection' && (
<>
<strong>Upload em Coleção:</strong> O arquivo será adicionado à coleção selecionada, mantendo organização e histórico de versões.
</>
)}
{selectedMode.type === 'fluid' && (
<>
<strong>Upload Fluido:</strong> Os dados anteriores serão substituídos pelos novos dados. Ideal para dashboards que precisam sempre dos dados mais recentes.
</>
)}
</div>
</div>
</CardContent>
</Card>
)
}