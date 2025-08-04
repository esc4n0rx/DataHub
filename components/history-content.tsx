"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Upload, Download, Database, FileText, RefreshCw, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { DashboardAPI } from "@/lib/dashboard-api"
import { RecentActivity, ActivitySummary } from "@/types/dashboard"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export function HistoryContent() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      
      const [activitiesData, summaryData] = await Promise.all([
        DashboardAPI.getRecentActivity(50), // Mais atividades para o histórico
        DashboardAPI.getActivitySummary()
      ])

      setActivities(activitiesData)
      setActivitySummary(summaryData)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar histórico'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistoryData()
  }, [])

  const getActionIcon = (action: string) => {
    if (action.includes('Upload')) return <Upload className="h-4 w-4 text-blue-600" />
    if (action.includes('Download')) return <Download className="h-4 w-4 text-green-600" />
    if (action.includes('relatório') || action.includes('Relatório')) return <FileText className="h-4 w-4 text-purple-600" />
    return <Database className="h-4 w-4 text-orange-600" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600">Sucesso</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      case "warning":
        return <Badge className="bg-yellow-600">Aviso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Info className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">Acompanhe todas as atividades realizadas no sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">Acompanhe todas as atividades realizadas no sistema</p>
        </div>
        <Button variant="outline" onClick={loadHistoryData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitySummary?.actions_today || 0}</div>
            <p className="text-xs text-muted-foreground">Atividades registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads Hoje</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitySummary?.uploads_today || 0}</div>
            <p className="text-xs text-muted-foreground">Arquivos enviados hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets Esta Semana</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitySummary?.reports_this_week || 0}</div>
            <p className="text-xs text-muted-foreground">Confirmados esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitySummary?.success_rate || 100}%</div>
            <p className="text-xs text-green-600">
              {activitySummary?.success_rate && activitySummary.success_rate >= 95 ? 'Excelente' : 'Bom'} desempenho
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Histórico detalhado das últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(activity.action)}
                          <span className="font-medium">{activity.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate" title={activity.file_name}>
                        {activity.file_name}
                      </TableCell>
                      <TableCell>{activity.user_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(activity.timestamp).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell className="max-w-64">
                        <div className="flex items-start space-x-2">
                          {getStatusIcon(activity.status)}
                          <span className="text-sm text-muted-foreground truncate">
                            {activity.details}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}