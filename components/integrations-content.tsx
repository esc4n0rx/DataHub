"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IntegrationsList } from "@/components/integrations/IntegrationsList"
import { CreateIntegrationModal } from "@/components/integrations/CreateIntegrationModal"
import { FileUploadZone } from "@/components/integrations/FileUploadZone"
import { IntegrationsAPI } from "@/lib/integrations-api"
import { IntegrationWithStats, IntegrationStats } from "@/types/integrations"
import { useToast } from "@/hooks/use-toast"
import { 
  Settings2, 
  Plus, 
  Upload, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database,
  TrendingUp,
  FileText
} from "lucide-react"

export function IntegrationsContent() {
  const [integrations, setIntegrations] = useState<IntegrationWithStats[]>([])
  const [stats, setStats] = useState<IntegrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>("")
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [integrationsData, statsData] = await Promise.all([
        IntegrationsAPI.getIntegrations(),
        IntegrationsAPI.getIntegrationStats()
      ])
      
      setIntegrations(integrationsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das integrações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateIntegration = async (data: any) => {
    try {
      await IntegrationsAPI.createIntegration(data)
      await loadData()
      setShowCreateModal(false)
      toast({
        title: "Sucesso",
        description: "Integração criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar integração:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a integração",
        variant: "destructive"
      })
    }
  }

  const handleDeleteIntegration = async (id: string) => {
    try {
      await IntegrationsAPI.deleteIntegration(id)
      await loadData()
      toast({
        title: "Sucesso",
        description: "Integração removida com sucesso"
      })
    } catch (error) {
      console.error('Erro ao deletar integração:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover a integração",
        variant: "destructive"
      })
    }
  }

  const handleToggleIntegration = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      // Usar o método específico para alterar status
      await IntegrationsAPI.toggleIntegrationStatus(id)
      await loadData()
      toast({
        title: "Sucesso",
        description: `Integração ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso`
      })
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da integração",
        variant: "destructive"
      })
    }
  }

  // Integrações ativas para upload
  const activeIntegrations = integrations.filter(i => i.status === 'active')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Gerencie integrações automáticas com sistemas externos
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Integrações</CardTitle>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_integrations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_integrations} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_runs_today}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stats.successful_runs_today} sucessos</span>
                {(stats.failed_runs_today) && (
                  <span className="text-red-600 ml-2">{stats.failed_runs_today} falhas</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arquivos Processados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_records_processed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de arquivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_runs_today > 0 
                  ? Math.round((stats.successful_runs_today / stats.total_runs_today) * 100)
                  : 100
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado nas execuções de hoje
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="upload">Upload Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Integrações Recentes</CardTitle>
                <CardDescription>
                  Atividade das últimas integrações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </div>
                ) : integrations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma integração encontrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {integrations.slice(0, 5).map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            integration.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{integration.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {integration.source_system}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs">{integration.successful_runs}</span>
                          </div>
                          {integration.failed_runs > 0 && (
                            <div className="flex items-center space-x-1">
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span className="text-xs">{integration.failed_runs}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Tarefas comuns para gerenciar integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Integração
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Manual
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('integrations')}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Gerenciar Integrações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsList
            integrations={integrations}
            loading={loading}
            onRefresh={loadData}
            onDelete={handleDeleteIntegration}
            onToggleStatus={handleToggleIntegration}
          />
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Manual</CardTitle>
              <CardDescription>
                Envie arquivos diretamente para uma integração específica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ Seletor de Integração */}
              {activeIntegrations.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecione uma Integração</label>
                    <Select
                      value={selectedIntegrationId}
                      onValueChange={setSelectedIntegrationId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma integração ativa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeIntegrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center space-x-2">
                              <span>{integration.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {integration.source_system}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ✅ FileUploadZone com integrationId */}
                  {selectedIntegrationId && (
                    <FileUploadZone
                      integrationId={selectedIntegrationId}
                      onUploadComplete={loadData}
                    />
                  )}

                  {!selectedIntegrationId && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Selecione uma integração para fazer upload</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma integração ativa encontrada</p>
                  <p className="text-sm">Crie uma integração primeiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateIntegrationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateIntegration}
        loading={loading}
      />
    </div>
  )
}