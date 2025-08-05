"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      await IntegrationsAPI.updateIntegration(id, { status: newStatus })
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
                {stats.failed_runs_today > 0 && (
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
              <div className="text-2xl font-bold">{stats.total_files_processed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de arquivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Processados</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_records_processed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de registros
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="upload">Upload Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <IntegrationsList
            integrations={integrations}
            loading={loading}
            onDelete={handleDeleteIntegration}
            onToggle={handleToggleIntegration}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Manual de Arquivos</span>
              </CardTitle>
              <CardDescription>
                Faça upload de arquivos diretamente para processamento imediato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateIntegrationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateIntegration}
        loading={false}
      />
    </div>
  )
}