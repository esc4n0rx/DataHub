"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Upload, Download, Database, FileText } from "lucide-react"

const mockHistoryData = [
  {
    id: 1,
    acao: "Upload de arquivo",
    descricao: "vendas_janeiro_2024.xlsx",
    usuario: "João Silva",
    timestamp: "2024-01-15 14:30:25",
    status: "Sucesso",
    tipo: "upload",
    detalhes: "1.247 registros processados",
  },
  {
    id: 2,
    acao: "Geração de relatório",
    descricao: "Relatório Financeiro Q4",
    usuario: "Maria Santos",
    timestamp: "2024-01-15 13:45:12",
    status: "Sucesso",
    tipo: "report",
    detalhes: "Exportado em PDF",
  },
  {
    id: 3,
    acao: "Sincronização SAP",
    descricao: "Dados de produtos atualizados",
    usuario: "Sistema",
    timestamp: "2024-01-15 12:00:00",
    status: "Sucesso",
    tipo: "sync",
    detalhes: "856 registros sincronizados",
  },
  {
    id: 4,
    acao: "Download de dados",
    descricao: "funcionarios_ativos.csv",
    usuario: "Pedro Costa",
    timestamp: "2024-01-15 11:15:33",
    status: "Sucesso",
    tipo: "download",
    detalhes: "342 registros exportados",
  },
  {
    id: 5,
    acao: "Upload de arquivo",
    descricao: "inventario_produtos.xlsx",
    usuario: "Ana Oliveira",
    timestamp: "2024-01-15 10:22:18",
    status: "Erro",
    tipo: "upload",
    detalhes: "Formato de data inválido na linha 45",
  },
  {
    id: 6,
    acao: "Backup automático",
    descricao: "Backup diário do sistema",
    usuario: "Sistema",
    timestamp: "2024-01-15 03:00:00",
    status: "Sucesso",
    tipo: "backup",
    detalhes: "Backup completo realizado",
  },
]

export function HistoryContent() {
  const getActionIcon = (tipo: string) => {
    switch (tipo) {
      case "upload":
        return <Upload className="h-4 w-4 text-blue-600" />
      case "download":
        return <Download className="h-4 w-4 text-green-600" />
      case "report":
        return <FileText className="h-4 w-4 text-purple-600" />
      case "sync":
      case "backup":
        return <Database className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sucesso":
        return <Badge className="bg-green-600">Sucesso</Badge>
      case "Erro":
        return <Badge variant="destructive">Erro</Badge>
      case "Em andamento":
        return <Badge className="bg-yellow-600">Em andamento</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground">Acompanhe todas as atividades realizadas no sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Arquivos enviados hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Gerados esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-green-600">+0.5% vs semana passada</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Histórico detalhado das últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistoryData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(item.tipo)}
                        <span className="font-medium">{item.acao}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>{item.usuario}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(item.timestamp).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.detalhes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
