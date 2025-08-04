"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, FileSpreadsheet, TrendingUp, Users, Clock, CheckCircle } from "lucide-react"

const stats = [
  {
    title: "Total de Registros",
    value: "24,847",
    description: "Registros no banco de dados",
    icon: Database,
    trend: "+12% desde o último mês",
  },
  {
    title: "Planilhas Processadas",
    value: "156",
    description: "Arquivos importados este mês",
    icon: FileSpreadsheet,
    trend: "+8 novos arquivos",
  },
  {
    title: "Taxa de Crescimento",
    value: "18.2%",
    description: "Crescimento mensal dos dados",
    icon: TrendingUp,
    trend: "+2.1% vs mês anterior",
  },
  {
    title: "Usuários Ativos",
    value: "42",
    description: "Usuários ativos no sistema",
    icon: Users,
    trend: "5 novos usuários",
  },
]

const recentActivity = [
  {
    action: "Upload de planilha",
    file: "vendas_q4_2024.xlsx",
    time: "2 minutos atrás",
    status: "success",
  },
  {
    action: "Relatório gerado",
    file: "relatorio_mensal.pdf",
    time: "15 minutos atrás",
    status: "success",
  },
  {
    action: "Sincronização SAP",
    file: "dados_financeiros.csv",
    time: "1 hora atrás",
    status: "success",
  },
  {
    action: "Backup automático",
    file: "backup_sistema.zip",
    time: "3 horas atrás",
    status: "success",
  },
]

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus dados e atividades do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.file}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Monitoramento em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Conexão SAP</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  <span className="text-xs text-green-600">Operacional</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Automático</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  <span className="text-xs text-green-600">Ativo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sincronização</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                  <span className="text-xs text-yellow-600">Em andamento</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
