// components/integrations/IntegrationCard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreateConnectorModal } from "./CreateConnectorModal"
import { ConnectorsAPI } from "@/lib/connectors-api"
import { IntegrationWithStats } from "@/types/integrations"
import { useToast } from "@/hooks/use-toast"
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Zap,
  Database,
  Plus
} from "lucide-react"

interface IntegrationCardProps {
  integration: IntegrationWithStats
  onDelete: (id: string) => void
  onToggle: (id: string, currentStatus: string) => void
}

export function IntegrationCard({ integration, onDelete, onToggle }: IntegrationCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCreateConnectorModal, setShowCreateConnectorModal] = useState(false)
  const [creatingConnector, setCreatingConnector] = useState(false)
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Ativa</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inativa</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'api':
        return <Zap className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(integration.api_key)
    toast({
      title: "Copiado!",
      description: "API Key copiada para a área de transferência"
    })
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(integration.webhook_url)
    toast({
      title: "Copiado!",
      description: "URL do Webhook copiada para a área de transferência"
    })
  }

  const handleCreateConnector = async (data: any) => {
    try {
      setCreatingConnector(true)
      await ConnectorsAPI.createConnector(data)
      setShowCreateConnectorModal(false)
      toast({
        title: "Sucesso",
        description: "Conector criado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar conector:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o conector",
        variant: "destructive"
      })
    } finally {
      setCreatingConnector(false)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              {getTypeIcon(integration.type)}
              <span>{integration.name}</span>
            </CardTitle>
            {integration.description && (
              <CardDescription className="text-sm">
                {integration.description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(integration.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateConnectorModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Conector
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyApiKey}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar API Key
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Webhook URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggle(integration.id, integration.status)}>
                  {integration.status === 'active' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Sistema:</span>
              <p className="font-medium">{integration.source_system}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <p className="font-medium capitalize">{integration.type}</p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{integration.successful_runs}</span>
              </div>
              {integration.failed_runs > 0 && (
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{integration.failed_runs}</span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground">
              {integration.total_runs} execuções
            </span>
          </div>

          {/* Última execução */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último sucesso:</span>
              <span>{formatDate(integration.last_success_at)}</span>
            </div>
            {integration.last_error_at && (
              <div className="flex justify-between text-red-600">
                <span>Último erro:</span>
                <span>{formatDate(integration.last_error_at)}</span>
              </div>
            )}
          </div>

          {/* Schedule para integrações agendadas */}
          {integration.type === 'scheduled' && integration.schedule_cron && (
            <div className="text-xs">
              <span className="text-muted-foreground">Agendamento:</span>
              <p className="font-mono text-xs bg-muted p-1 rounded">
                {integration.schedule_cron}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Integração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a integração "{integration.name}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(integration.id)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateConnectorModal
        isOpen={showCreateConnectorModal}
        onClose={() => setShowCreateConnectorModal(false)}
        onConfirm={handleCreateConnector}
        loading={creatingConnector}
        integration={integration}
      />
    </>
  )
}