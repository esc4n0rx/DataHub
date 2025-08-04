"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Filter, Search } from "lucide-react"

const mockReportsData = [
  {
    id: "REL001",
    titulo: "Relatório de Vendas Q4",
    categoria: "Vendas",
    status: "Ativo",
    dataAtualizacao: "2024-01-15",
    registros: 1247,
    autor: "João Silva",
  },
  {
    id: "REL002",
    titulo: "Análise Financeira Mensal",
    categoria: "Financeiro",
    status: "Processando",
    dataAtualizacao: "2024-01-14",
    registros: 856,
    autor: "Maria Santos",
  },
  {
    id: "REL003",
    titulo: "Dados de RH - Funcionários",
    categoria: "Recursos Humanos",
    status: "Ativo",
    dataAtualizacao: "2024-01-13",
    registros: 342,
    autor: "Pedro Costa",
  },
  {
    id: "REL004",
    titulo: "Inventário de Produtos",
    categoria: "Estoque",
    status: "Erro",
    dataAtualizacao: "2024-01-12",
    registros: 2156,
    autor: "Ana Oliveira",
  },
  {
    id: "REL005",
    titulo: "Relatório de Marketing",
    categoria: "Marketing",
    status: "Ativo",
    dataAtualizacao: "2024-01-11",
    registros: 678,
    autor: "Carlos Lima",
  },
]

export function ReportsContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredReports = mockReportsData.filter((report) => {
    const matchesSearch =
      report.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.autor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || report.categoria === selectedCategory
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-600">Ativo</Badge>
      case "Processando":
        return <Badge className="bg-yellow-600">Processando</Badge>
      case "Erro":
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Gerencie e visualize todos os relatórios do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
          <CardDescription>Use os filtros para encontrar relatórios específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Estoque">Estoque</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Processando">Processando</SelectItem>
                  <SelectItem value="Erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Tudo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Relatórios</CardTitle>
          <CardDescription>{filteredReports.length} relatórios encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-sm">{report.id}</TableCell>
                    <TableCell className="font-medium">{report.titulo}</TableCell>
                    <TableCell>{report.categoria}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{new Date(report.dataAtualizacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{report.registros.toLocaleString()}</TableCell>
                    <TableCell>{report.autor}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          CSV
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Excel
                        </Button>
                      </div>
                    </TableCell>
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
