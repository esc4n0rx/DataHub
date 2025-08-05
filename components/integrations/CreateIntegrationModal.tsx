"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateIntegrationData } from "@/types/integrations"
import { Collection } from "@/types/collections"
import { CollectionsAPI } from "@/lib/collections-api"
import { Clock, Zap, Database, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: CreateIntegrationData) => void
  loading: boolean
}

const INTEGRATION_TYPES = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'Upload manual de arquivos',
    icon: Database
  },
  {
    value: 'api',
    label: 'API/Webhook',
    description: 'Recebe arquivos via API',
    icon: Zap
  },
  {
    value: 'scheduled',
    label: 'Agendada',
    description: 'Execução automática por agendamento',
    icon: Clock
  }
]

const SOURCE_SYSTEMS = [
  { value: 'SAP', label: 'SAP' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'MySQL', label: 'MySQL' },
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'Excel/CSV', label: 'Excel/CSV' },
  { value: 'API Externa', label: 'API Externa' },
  { value: 'Sistema Customizado', label: 'Sistema Customizado' },
  { value: 'Outro', label: 'Outro' }
]

export function CreateIntegrationModal({ isOpen, onClose, onConfirm, loading }: CreateIntegrationModalProps) {
  const [formData, setFormData] = useState<CreateIntegrationData>({
    name: '',
    description: '',
    type: 'manual',
    source_system: '',
    target_collection_id: '',
    file_pattern: '*',
    schedule_cron: '',
    file_retention_days: 7
  })
  const [collections, setCollections] = useState<Collection[]>([])
  const [step, setStep] = useState(1)
  const [loadingCollections, setLoadingCollections] = useState(false)
  const { toast } = useToast()

  const loadCollections = async () => {
    try {
      setLoadingCollections(true)
      const data = await CollectionsAPI.getCollections()
      setCollections(data)
    } catch (error) {
      console.error('Erro ao carregar coleções:', error)
    } finally {
      setLoadingCollections(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCollections()
      setStep(1)
      setFormData({
        name: '',
        description: '',
        type: 'manual',
        source_system: '',
        target_collection_id: '',
        file_pattern: '*',
        schedule_cron: '',
        file_retention_days: 7
      })
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da integração é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!formData.source_system.trim()) {
      toast({
        title: "Erro",
        description: "Sistema de origem é obrigatório",
        variant: "destructive"
      })
      return
    }

    onConfirm(formData)
  }

  const generateWebhookUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-app.com'
    return `${baseUrl}/api/integrations/webhook/[API_KEY]`
  }

  const copyExampleScript = () => {
    const script = `@echo off
echo Executando integração ${formData.name}...

REM Executar seu script de extração de dados aqui
REM Exemplo: cscript //nologo export.vbs

REM Verificar se o arquivo foi gerado
if exist "dados.csv" (
    echo ✅ Arquivo gerado com sucesso!
    
    REM Enviar arquivo para o DataHub
    curl -X POST "${generateWebhookUrl()}" ^
         -H "Authorization: Bearer [SUA_API_KEY]" ^
         -F "file=@dados.csv" ^
         -F "source=${formData.source_system}"
    
    echo ✅ Arquivo enviado para o DataHub!
) else (
    echo ❌ Erro: Arquivo não encontrado
)

pause`

    navigator.clipboard.writeText(script)
    toast({
      title: "Copiado!",
      description: "Script de exemplo copiado para a área de transferência"
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Integração</DialogTitle>
          <DialogDescription>
            Configure uma nova integração para automatizar o envio de dados
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Integração</Label>
                <Input
                  id="name"
                  placeholder="Ex: Dados SAP Vendas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que esta integração faz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Integração</Label>
                <div className="grid gap-3">
                  {INTEGRATION_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-all ${
                          formData.type === type.value
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setFormData({ ...formData, type: type.value as any })}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center space-x-2 text-sm">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {type.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Configurações Técnicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source_system">Sistema de Origem</Label>
                <Select 
                  value={formData.source_system} 
                  onValueChange={(value) => setFormData({ ...formData, source_system: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sistema..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_SYSTEMS.map((system) => (
                      <SelectItem key={system.value} value={system.value}>
                        {system.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_collection">Coleção de Destino (opcional)</Label>
                <Select 
                  value={formData.target_collection_id || 'none'} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    target_collection_id: value === 'none' ? '' : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma coleção..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (criar automaticamente)</SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_pattern">Padrão de Arquivos</Label>
                <Input
                  id="file_pattern"
                  placeholder="Ex: *.csv, dados_*.xlsx"
                  value={formData.file_pattern}
                  onChange={(e) => setFormData({ ...formData, file_pattern: e.target.value })}
                />
              </div>

              {formData.type === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="schedule_cron">Agendamento (Cron)</Label>
                  <Input
                    id="schedule_cron"
                    placeholder="Ex: 0 8 * * * (todo dia às 8h)"
                    value={formData.schedule_cron}
                    onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use formato cron padrão. Exemplos: "0 8 * * *" (8h diário), "0 */2 * * *" (a cada 2h)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="retention">Retenção de Arquivos (dias)</Label>
                <Select 
                  value={formData.file_retention_days.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, file_retention_days: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Resumo e Instruções */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Resumo da Integração</h3>
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="font-medium capitalize">{formData.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sistema:</span>
                        <p className="font-medium">{formData.source_system}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retenção:</span>
                        <p className="font-medium">{formData.file_retention_days} dias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {formData.type === 'api' && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Como Usar</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Script de Exemplo</CardTitle>
                      <CardDescription>
                        Use este script como base para enviar arquivos automaticamente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
                        <pre>{`curl -X POST "${generateWebhookUrl()}" \\
     -H "Authorization: Bearer [API_KEY]" \\
     -F "file=@seu_arquivo.csv" \\
     -F "source=${formData.source_system}"`}</pre>
                      </div>
                      <Button variant="outline" size="sm" onClick={copyExampleScript}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Script Completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Integração'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}