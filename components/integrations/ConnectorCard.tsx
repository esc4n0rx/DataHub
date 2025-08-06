// components/integrations/ConnectorCard.tsx
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
import { Connector } from "@/types/connectors"
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Eye,
  ExternalLink,
  Activity,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ConnectorCardProps {
  connector: Connector
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onViewEndpoint: (connector: Connector) => void
}

export function ConnectorCard({ connector, onDelete, onToggle, onViewEndpoint }: ConnectorCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-600">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>
  }

  const getFormatBadge = (format: string) => {
    const colors = {
      json: 'bg-blue-600',
      csv: 'bg-green-600', 
      xml: 'bg-orange-600'
    }
    
    return <Badge className={colors[format as keyof typeof colors] || 'bg-gray-600'}>
      {format.toUpperCase()}
    </Badge>
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

  const copyEndpoint = () => {
    navigator.clipboard.writeText(connector.endpoint_url)
    toast({
      title: "Copiado!",
      description: "URL do endpoint copiada para a área de transferência"
    })
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(connector.api_key)
    toast({
      title: "Copiado!",
      description: "API Key copiada para a área de transferência"
    })
  }

  const openEndpoint = () => {
    window.open(connector.endpoint_url, '_blank')
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {connector.name}
            </CardTitle>
            {connector.description && (
              <CardDescription className="text-sm">
                {connector.description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(connector.is_active)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewEndpoint(connector)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Endpoint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyEndpoint}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyApiKey}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar API Key
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEndpoint}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no Navegador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggle(connector.id)}>
                  {connector.is_active ? (
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
          {/* Informações técnicas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Formato:</span>
              <div className="mt-1">
                {getFormatBadge(connector.data_format)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Refresh:</span>
              <p className="font-medium">
                {connector.refresh_interval}min
              </p>
            </div>
          </div>

          {/* Estatísticas de uso */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>{connector.access_count} acessos</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-4 w-4 text-green-600" />
              <span>{connector.refresh_interval} min</span>
            </div>
          </div>

          {/* Último acesso */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último acesso:</span>
              <span>{formatDate(connector.last_accessed_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em:</span>
              <span>{formatDate(connector.created_at)}</span>
            </div>
          </div>

          {/* URL do endpoint (truncada) */}
          <div className="text-xs">
            <span className="text-muted-foreground">Endpoint:</span>
            <p className="font-mono text-xs bg-muted p-2 rounded truncate">
              {connector.endpoint_url}
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conector</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o conector "{connector.name}"? 
              Esta ação não pode ser desfeita e o endpoint ficará inacessível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(connector.id)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}