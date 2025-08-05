// components/integrations/CreateIntegrationModal.tsx
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
import { Clock, Zap, Database, Copy, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UploadTypeSelector } from "./UploadTypeSelector"

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
    file_retention_days: 7,
    upload_type: 'dataset',
    dataset_name_pattern: '',
    fluid_config: {
      preserve_schema: false,
      backup_previous: true
    }
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
      toast({
        title: "Erro",
        description: "Falha ao carregar coleções",
        variant: "destructive"
      })
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
        file_retention_days: 7,
        upload_type: 'dataset',
        dataset_name_pattern: '',
        fluid_config: {
          preserve_schema: false,
          backup_previous: true
        }
      })
    }
  }, [isOpen])

  const handleFormDataChange = (updates: Partial<CreateIntegrationData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = () => {
    // Validações básicas
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

    // Validações específicas do tipo de upload
    if ((formData.upload_type === 'collection' || formData.upload_type === 'fluid') && 
        !formData.target_collection_id) {
      toast({
        title: "Erro",
        description: "Selecione uma coleção de destino",
        variant: "destructive"
      })
      return
    }

    // Se não tem padrão de nome, usar o nome da integração
    const finalData = {
      ...formData,
      dataset_name_pattern: formData.dataset_name_pattern || formData.name
    }

    onConfirm(finalData)
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

  const canProceedToStep2 = () => {
    return formData.name.trim() && 
           formData.source_system.trim() && 
           formData.type
  }

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Informações Básicas"
      case 2: return "Configurações de Upload"
      case 3: return "Configurações Técnicas"
      default: return "Nova Integração"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Nova Integração</span>
            <Badge variant="outline">Passo {step} de 3</Badge>
          </DialogTitle>
          <DialogDescription>
            {getStepTitle()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo 1: Informações Básicas */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Integração</CardTitle>
                  <CardDescription>
                    Configure as informações básicas da integração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Integração *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Importação SAP Vendas"
                        value={formData.name}
                        onChange={(e) => handleFormDataChange({ name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source_system">Sistema de Origem *</Label>
                      <Select
                        value={formData.source_system}
                        onValueChange={(value) => handleFormDataChange({ source_system: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_SYSTEMS.map(system => (
                            <SelectItem key={system.value} value={system.value}>
                              {system.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o propósito desta integração..."
                      value={formData.description}
                      onChange={(e) => handleFormDataChange({ description: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Integração</CardTitle>
                  <CardDescription>
                    Como a integração será executada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {INTEGRATION_TYPES.map((type) => {
                      const Icon = type.icon
                      const isSelected = formData.type === type.value
                      
                      return (
                        <div
                          key={type.value}
                          className={`
                            p-4 border rounded-lg cursor-pointer transition-all
                            ${isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          onClick={() => !loading && handleFormDataChange({ type: type.value as any })}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`} />
                            <Icon className="h-5 w-5" />
                            <div className="flex-1">
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Passo 2: Configurações de Upload */}
          {step === 2 && (
            <UploadTypeSelector
              formData={formData}
              onChange={handleFormDataChange}
              collections={collections}
              disabled={loading || loadingCollections}
            />
          )}

          {/* Passo 3: Configurações Técnicas */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Técnicas</CardTitle>
                  <CardDescription>
                    Ajustes avançados da integração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="file_pattern">Padrão de Arquivo</Label>
                      <Input
                        id="file_pattern"
                        placeholder="*.csv ou vendas_*.xlsx"
                        value={formData.file_pattern}
                        onChange={(e) => handleFormDataChange({ file_pattern: e.target.value })}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use * para qualquer caractere. Ex: dados_*.csv
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retenção de Arquivos (dias)</Label>
                      <Input
                        id="retention"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.file_retention_days}
                        onChange={(e) => handleFormDataChange({ 
                          file_retention_days: parseInt(e.target.value) || 7 
                        })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {formData.type === 'scheduled' && (
                    <div className="space-y-2">
                      <Label htmlFor="schedule">Agendamento (Cron)</Label>
                      <Input
                        id="schedule"
                        placeholder="0 9 * * 1-5 (Segunda a sexta às 9h)"
                        value={formData.schedule_cron}
                        onChange={(e) => handleFormDataChange({ schedule_cron: e.target.value })}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formato cron: minuto hora dia mês dia-da-semana
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {formData.type === 'api' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Configuração de Webhook</span>
                    </CardTitle>
                    <CardDescription>
                      URL e exemplo de código para integração via API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">URL do Webhook</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generateWebhookUrl())
                            toast({ title: "URL copiada!" })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <code className="text-sm bg-background p-2 rounded block">
                        {generateWebhookUrl()}
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        A API Key será gerada após criar a integração
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Script de Exemplo (Windows)</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyExampleScript}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                      <div className="bg-muted p-4 rounded-lg text-sm">
                        <pre className="whitespace-pre-wrap text-xs">
{`@echo off
echo Executando integração ${formData.name}...

REM Executar seu script de extração aqui
curl -X POST "${generateWebhookUrl()}" \\
     -H "Authorization: Bearer [API_KEY]" \\
     -F "file=@dados.csv" \\
     -F "source=${formData.source_system}"

echo ✅ Arquivo enviado!`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumo da Configuração */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline">
                        {INTEGRATION_TYPES.find(t => t.value === formData.type)?.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sistema:</span>
                      <span className="font-medium">{formData.source_system}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload:</span>
                      <Badge variant="outline">
                        {formData.upload_type === 'dataset' && 'Dataset Individual'}
                        {formData.upload_type === 'collection' && 'Adicionar à Coleção'}
                        {formData.upload_type === 'fluid' && 'Upload Fluido'}
                      </Badge>
                    </div>
                    {formData.target_collection_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coleção:</span>
                        <span className="font-medium">
                          {collections.find(c => c.id === formData.target_collection_id)?.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Padrão do Nome:</span>
                      <span className="font-medium">
                        {formData.dataset_name_pattern || formData.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={loading || (step === 1 && !canProceedToStep2())}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar Integração"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}