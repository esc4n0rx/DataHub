"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useUpload } from '@/hooks/use-upload'

interface FileAnalyzerProps {
  onAnalysisComplete?: () => void
}

export function FileAnalyzer({ onAnalysisComplete }: FileAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [description, setDescription] = useState('')
  const { analyzeFile, isUploading, progress } = useUpload()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!datasetName) {
        // Auto-gerar nome baseado no arquivo
        const name = file.name.split('.')[0].replace(/[_-]/g, ' ')
        setDatasetName(name.charAt(0).toUpperCase() + name.slice(1))
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !datasetName.trim()) return

    try {
      await analyzeFile(selectedFile, datasetName.trim())
      onAnalysisComplete?.()
    } catch (error) {
      console.error('Erro na análise:', error)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setDatasetName('')
    setDescription('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Analisador de Arquivos</span>
        </CardTitle>
        <CardDescription>
          Selecione um arquivo CSV ou Excel para análise automática de tipos de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Dataset */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dataset-name">Nome do Dataset *</Label>
            <Input
              id="dataset-name"
              placeholder="Ex: Vendas Q4 2024"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-input">Arquivo *</Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descreva o conteúdo deste dataset..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            rows={3}
          />
        </div>

        {/* Arquivo Selecionado */}
        {selectedFile && (
          <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!isUploading && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Remover
              </Button>
            )}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{progress.phase}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex space-x-3">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || !datasetName.trim() || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analisar Arquivo
              </>
            )}
          </Button>
          
          {!isUploading && (selectedFile || datasetName) && (
            <Button variant="outline" onClick={handleReset}>
              Limpar
            </Button>
          )}
        </div>

        {/* Instruções */}
        <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
          <h4 className="font-medium text-foreground">Instruções:</h4>
          <ul className="space-y-1 ml-4">
            <li>• Formatos aceitos: CSV, Excel (.xlsx, .xls)</li>
            <li>• Primeira linha deve conter os cabeçalhos das colunas</li>
            <li>• Tamanho máximo: 100MB por arquivo</li>
            <li>• O sistema detectará automaticamente os tipos de dados</li>
            <li>• Você poderá ajustar os tipos antes da importação final</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}