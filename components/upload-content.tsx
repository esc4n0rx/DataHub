"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const mockPreviewData = [
  { id: 1, nome: "João Silva", email: "joao@empresa.com", departamento: "Vendas", salario: "R$ 5.000" },
  { id: 2, nome: "Maria Santos", email: "maria@empresa.com", departamento: "Marketing", salario: "R$ 4.500" },
  { id: 3, nome: "Pedro Costa", email: "pedro@empresa.com", departamento: "TI", salario: "R$ 6.000" },
  { id: 4, nome: "Ana Oliveira", email: "ana@empresa.com", departamento: "RH", salario: "R$ 4.800" },
]

export function UploadContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowPreview(true)
      setUploadSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    // Simular upload
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsUploading(false)
    setUploadSuccess(true)
    setShowPreview(false)
    setSelectedFile(null)
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setShowPreview(false)
    setUploadSuccess(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de Dados</h1>
        <p className="text-muted-foreground">Importe arquivos CSV e Excel para o sistema</p>
      </div>

      {uploadSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Arquivo enviado com sucesso! Os dados foram processados e adicionados ao sistema.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Selecionar Arquivo</span>
            </CardTitle>
            <CardDescription>Escolha um arquivo CSV ou Excel para importar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="flex-1">
                {isUploading ? "Enviando..." : "Confirmar Upload"}
              </Button>
              <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
            <CardDescription>Diretrizes para upload de arquivos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Formatos Aceitos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Arquivos CSV (.csv)</li>
                <li>• Excel (.xlsx, .xls)</li>
                <li>• Tamanho máximo: 10MB</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Requisitos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Primeira linha deve conter cabeçalhos</li>
                <li>• Dados devem estar organizados em colunas</li>
                <li>• Evite células mescladas</li>
                <li>• Use codificação UTF-8 para caracteres especiais</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Os dados serão validados antes da importação. Registros com erros serão destacados para correção.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização dos Dados</CardTitle>
            <CardDescription>Verifique os dados antes de confirmar o upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Salário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPreviewData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell className="font-medium">{row.nome}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.departamento}</TableCell>
                      <TableCell>{row.salario}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando 4 de 247 registros encontrados no arquivo
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
