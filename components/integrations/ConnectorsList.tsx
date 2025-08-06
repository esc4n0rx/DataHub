// components/integrations/ConnectorsList.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConnectorCard } from "./ConnectorCard"
import { CreateConnectorModal } from "./CreateConnectorModal"
import { ConnectorEndpoint } from "./ConnectorEndpoint"
import { ConnectorsAPI } from "@/lib/connectors-api"
import { Connector } from "@/types/connectors"
import { IntegrationWithStats } from "@/types/integrations"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Search, 
  Zap, 
  Activity, 
  Database,
  Filter
} from "lucide-react"

interface ConnectorsListProps {
  integrations: IntegrationWithStats[]
  onRefresh: () => void
}

export function ConnectorsList({ integrations, onRefresh }: ConnectorsListProps) {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [filteredConnectors, setFilteredConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationWithStats | undefined>()
  const [selectedConnector, setSelectedConnector] = useState<Connector | undefined>()
  const [showEndpointModal, setShowEndpointModal] = useState(false)
  const { toast } = useToast()

  const loadConnectors = async () => {
    try {
      setLoading(true)
      const data = await ConnectorsAPI.getAllConnectors()
      setConnectors(data)
    } catch (error) {
      console.error('Erro ao carregar conectores:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os conectores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnectors()
  }, [])

  // Filtrar conectores
  useEffect(() => {
    let filtered = connectors

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(connector =>
        connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(connector =>
        statusFilter === 'active' ? connector.is_active : !connector.is_active
      )
    }

    setFilteredConnectors(filtered)
  }, [connectors, searchTerm, statusFilter])

  const handleCreateConnector = async (data: any) => {
    try {
      await ConnectorsAPI.createConnector(data)
      await loadConnectors()
      setShowCreateModal(false)
      setSelectedIntegration(undefined)
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
    }
  }

  const handleDeleteConnector = async (id: string) => {
    try {
      await ConnectorsAPI.deleteConnector(id)
      await loadConnectors()
      toast({
        title: "Sucesso",
        description: "Conector removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao deletar conector:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o conector",
        variant: "destructive"
      })
    }
  }

  const handleToggleConnector = async (id: string) => {
    try {
      await ConnectorsAPI.toggleConnectorStatus(id)
      await loadConnectors()
      toast({
        title: "Sucesso",
        description: "Status do conector alterado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do conector",
        variant: "destructive"
      })
    }
  }

  const handleViewEndpoint = (connector: Connector) => {
    setSelectedConnector(connector)
    setShowEndpointModal(true)
  }

  const openCreateModal = (integration?: IntegrationWithStats) => {
    setSelectedIntegration(integration)
    setShowCreateModal(true)
  }

  const activeConnectors = connectors.filter(c => c.is_active)
  const totalRequests = connectors.reduce((sum, c) => sum + c.access_count, 0)

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conectores</h2>
          <p className="text-muted-foreground">
            Endpoints públicos para acessar dados das integrações
          </p>
        </div>
        <Button onClick={() => openCreateModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Conector
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conectores</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectores Ativos</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeConnectors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conectores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex space-x-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Ativos
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inativos
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de conectores */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConnectors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConnectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onDelete={handleDeleteConnector}
              onToggle={handleToggleConnector}
              onViewEndpoint={handleViewEndpoint}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhum conector encontrado' : 'Nenhum conector criado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro conector para disponibilizar dados via API'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={() => openCreateModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Conector
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateConnectorModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedIntegration(undefined)
        }}
        onConfirm={handleCreateConnector}
        loading={loading}
        integration={selectedIntegration}
      />

      {selectedConnector && (
        <ConnectorEndpoint
          isOpen={showEndpointModal}
          onClose={() => {
            setShowEndpointModal(false)
            setSelectedConnector(undefined)
          }}
          connector={selectedConnector}
        />
      )}
    </div>
  )
}