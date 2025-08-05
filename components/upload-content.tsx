"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Database, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUpload } from "@/hooks/use-upload"
import { FileAnalyzer } from "./upload/FileAnalyzer"
import { DataTypeSelector } from "./upload/DataTypeSelector"
import { UploadProgress } from "./upload/UploadProgress"
import { UploadLogs } from "./upload/UploadLogs"
import { CollectionSelector } from "./upload/CollectionSelector"
import { FluidUploadMode } from "./upload/FluidUploadMode"
import { UploadMode, FluidUploadConfig } from "@/types/collections"

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
  const [showDataTypeSelector, setShowDataTypeSelector] = useState(false)
  
  // Novos estados para coleções
  const [uploadMode, setUploadMode] = useState<UploadMode>({ type: 'individual' })
  const [fluidConfig, setFluidConfig] = useState<FluidUploadConfig | null>(null)

  const { 
    progress, 
    analysisResult, 
    logs, 
    isUploading: isAnalyzing,
    analyzeFile,
    confirmWithAdjustments,
    loadLogs,
    reset
  } = useUpload()

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
    setUploadMode({ type: 'individual' })
    setFluidConfig(null)
    reset()
    setShowDataTypeSelector(false)
  }

  const handleAnalysisComplete = () => {
    if (analysisResult?.needs_adjustment) {
      setShowDataTypeSelector(true)
    }
  }

  const handleConfirmAdjustments = async (adjustments: any[]) => {
    if (!selectedFile) return
    
    setShowDataTypeSelector(false)
    
    // Passar configurações de coleção e upload fluido
    await confirmWithAdjustments(adjustments, selectedFile, {
      uploadMode,
      fluidConfig: uploadMode.type === 'fluid' ? fluidConfig : undefined
    })
  }

  const handleRefreshLogs = () => {
    if (analysisResult?.dataset_id) {
      loadLogs(analysisResult.dataset_id)
    }
  }

  const handleModeChange = (mode: UploadMode) => {
    setUploadMode(mode)
    // Reset configurações fluidas se não for upload fluido
    if (mode.type !== 'fluid') {
      setFluidConfig(null)
    }
  }

  const handleFluidConfigChange = (config: FluidUploadConfig) => {
    setFluidConfig(config)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de Dados</h1>
        <p className="text-muted-foreground">
          Importe arquivos CSV e Excel com análise automática de tipos de dados e organização em coleções
        </p>
      </div>

      {uploadSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Arquivo enviado com sucesso! Os dados foram processados e adicionados ao sistema.
          </AlertDescription>
        </Alert>
      )}

      {/* Seletor de Modo de Upload */}
      <CollectionSelector
        selectedMode={uploadMode}
        onModeChange={handleModeChange}
        disabled={isAnalyzing || !!progress}
      />

      {/* Configurações de Upload Fluido */}
      {uploadMode.type === 'fluid' && uploadMode.collection_id && (
        <FluidUploadMode
          collectionId={uploadMode.collection_id}
          onConfigChange={handleFluidConfigChange}
          disabled={isAnalyzing || !!progress}
        />
      )}

      {/* Sistema de Upload Inteligente */}
      <FileAnalyzer 
        onAnalysisComplete={handleAnalysisComplete}
        uploadMode={uploadMode}
        fluidConfig={fluidConfig}
      />

      {/* Progress do Upload */}
      {progress && (
        <UploadProgress progress={progress} />
      )}

      {/* Modal de Ajuste de Tipos */}
      <DataTypeSelector
        analysisResult={analysisResult}
        isOpen={showDataTypeSelector}
        onClose={() => setShowDataTypeSelector(false)}
        onConfirm={handleConfirmAdjustments}
        isProcessing={isAnalyzing}
        uploadMode={uploadMode}
      />

      {/* Logs do Upload */}
      {(logs.length > 0 || analysisResult?.dataset_id) && (
        <UploadLogs
          datasetId={analysisResult?.dataset_id}
          logs={logs}
          onRefresh={handleRefreshLogs}
          isLoading={isAnalyzing}
        />
      )}

      {/* Sistema Antigo - manter apenas como exemplo */}
      <div className="grid gap-6 md:grid-cols-2">
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
                <li>• Tamanho máximo: 100MB</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Novos Recursos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Coleções:</strong> Organize uploads por categoria</li>
                <li>• <strong>Upload Fluido:</strong> Atualize dados para dashboards em tempo real</li>
                <li>• <strong>Histórico de Versões:</strong> Mantenha controle das alterações</li>
                <li>• <strong>Análise Inteligente:</strong> Detecção automática de tipos</li>
                <li>• <strong>Validação de Esquema:</strong> Consistência nos uploads fluidos</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Use coleções para organizar seus dados e upload fluido para manter dashboards sempre atualizados.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exemplos de Uso</CardTitle>
            <CardDescription>Como usar cada modo de upload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Upload Individual:</h4>
              <p className="text-sm text-muted-foreground">
                Para dados únicos ou históricos que não precisam ser atualizados.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Coleção "Vendas":</h4>
              <p className="text-sm text-muted-foreground">
                Agrupe relatórios mensais, mantendo histórico completo de vendas.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Upload Fluido "Estoque":</h4>
              <p className="text-sm text-muted-foreground">
                Atualize dados de estoque várias vezes ao dia para dashboards em tempo real.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização dos Dados (Sistema Legado)</CardTitle>
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

      {/* Reset Button */}
      {(progress || analysisResult || logs.length > 0) && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={resetUpload}>
            <Settings className="h-4 w-4 mr-2" />
            Novo Upload
          </Button>
        </div>
      )}
    </div>
  )
}