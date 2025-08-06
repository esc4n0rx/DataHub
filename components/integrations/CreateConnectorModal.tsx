// components/integrations/CreateConnectorModal.tsx
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
import { CreateConnectorData } from "@/types/connectors"
import { IntegrationWithStats } from "@/types/integrations"
import { Zap, Database, FileJson, FileSpreadsheet, FileCode } from "lucide-react"

interface CreateConnectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: CreateConnectorData) => void
  loading: boolean
  integration?: IntegrationWithStats
}

const DATA_FORMATS = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Formato ideal para APIs e Power BI',
    icon: FileJson
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Formato ideal para Excel e análises',
    icon: FileSpreadsheet
  },
  {
    value: 'xml',
    label: 'XML',
    description: 'Formato estruturado para sistemas legados',
    icon: FileCode
  }
]

const REFRESH_INTERVALS = [
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '24 horas' }
]

export function CreateConnectorModal({ isOpen, onClose, onConfirm, loading, integration }: CreateConnectorModalProps) {
  const [formData, setFormData] = useState<CreateConnectorData>({
    integration_id: '',
    name: '',
    description: '',
    data_format: 'json',
    refresh_interval: 60
  })

  useEffect(() => {
    if (isOpen && integration) {
      setFormData(prev => ({
        ...prev,
        integration_id: integration.id,
        name: `Conector ${integration.name}`,
        description: `Endpoint de dados para a integração ${integration.name}`
      }))
    }
  }, [isOpen, integration])

  const handleFormDataChange = (updates: Partial<CreateConnectorData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.integration_id) return
    onConfirm(formData)
  }

  const resetForm = () => {
    setFormData({
      integration_id: integration?.id || '',
      name: integration ? `Conector ${integration.name}` : '',
      description: integration ? `Endpoint de dados para a integração ${integration.name}` : '',
      data_format: 'json',
      refresh_interval: 60
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const isValid = formData.name.trim() && formData.integration_id

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Novo Conector</span>
          </DialogTitle>
          <DialogDescription>
            Crie um endpoint público para acessar os dados processados da integração
            {integration && (
              <>
                {" "}
                <Badge variant="outline" className="ml-2">
                  {integration.name}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Conector *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Conector Vendas SAP"
                  value={formData.name}
                  onChange={(e) => handleFormDataChange({ name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito deste conector..."
                  value={formData.description}
                  onChange={(e) => handleFormDataChange({ description: e.target.value })}
                  disabled={loading}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Técnicas</CardTitle>
              <CardDescription>
                Configure o formato de retorno e frequência de atualização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formato de dados */}
              <div className="space-y-3">
                <Label>Formato dos Dados *</Label>
                <div className="grid gap-3">
                  {DATA_FORMATS.map((format) => {
                    const Icon = format.icon
                    const isSelected = formData.data_format === format.value
                    
                    return (
                      <div
                        key={format.value}
                        className={`
                          p-3 border rounded-lg cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-border'
                          }
                        `}
                        onClick={() => handleFormDataChange({ data_format: format.value as any })}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{format.label}</span>
                              {isSelected && <Badge>Selecionado</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Intervalo de refresh */}
              <div className="space-y-2">
                <Label htmlFor="refresh_interval">Intervalo de Cache *</Label>
                <Select
                  value={formData.refresh_interval.toString()}
                  onValueChange={(value) => handleFormDataChange({ refresh_interval: parseInt(value) })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFRESH_INTERVALS.map(interval => (
                      <SelectItem key={interval.value} value={interval.value.toString()}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tempo que os dados ficam em cache antes de serem atualizados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview do endpoint */}
          {isValid && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Preview do Endpoint</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
               <div className="space-y-3">
                 <div>
                   <Label className="text-sm">URL do Endpoint</Label>
                   <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                     /api/connectors/{integration?.id}/data?key=[API_KEY]
                   </p>
                 </div>
                 <div>
                   <Label className="text-sm">Formato de Resposta</Label>
                   <Badge variant="outline" className="ml-2">
                     {formData.data_format.toUpperCase()}
                   </Badge>
                 </div>
                 <div>
                   <Label className="text-sm">Cache</Label>
                   <p className="text-sm text-muted-foreground mt-1">
                     Dados atualizados a cada {REFRESH_INTERVALS.find(i => i.value === formData.refresh_interval)?.label}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
       </div>

       <DialogFooter>
         <Button
           variant="outline"
           onClick={handleClose}
           disabled={loading}
         >
           Cancelar
         </Button>
         <Button
           onClick={handleSubmit}
           disabled={!isValid || loading}
         >
           {loading ? "Criando..." : "Criar Conector"}
         </Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
 )
}