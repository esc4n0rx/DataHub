"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { AnalysisResult, DataType, DataTypeAdjustment } from '@/types/upload'

interface DataTypeSelectorProps {
  analysisResult: AnalysisResult | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (adjustments: DataTypeAdjustment[]) => void
  isProcessing?: boolean
}

const DATA_TYPE_OPTIONS: { value: DataType; label: string; description: string }[] = [
  { value: 'text', label: 'Texto', description: 'Texto livre' },
  { value: 'number', label: 'Número', description: 'Valores numéricos' },
  { value: 'date', label: 'Data', description: 'Datas e horários' },
  { value: 'boolean', label: 'Booleano', description: 'Verdadeiro/Falso' },
  { value: 'email', label: 'Email', description: 'Endereços de email' },
  { value: 'phone', label: 'Telefone', description: 'Números de telefone' },
]

export function DataTypeSelector({
  analysisResult,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false
}: DataTypeSelectorProps) {
  const [adjustments, setAdjustments] = useState<DataTypeAdjustment[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (analysisResult) {
      const initialAdjustments = analysisResult.columns.map(col => ({
        column_index: col.index,
        column_name: col.name,
        data_type: col.suggested_type,
        is_required: false
      }))
      setAdjustments(initialAdjustments)
      setHasChanges(false)
    }
  }, [analysisResult])

  const updateAdjustment = (columnIndex: number, field: keyof DataTypeAdjustment, value: any) => {
    setAdjustments(prev => prev.map(adj => 
      adj.column_index === columnIndex 
        ? { ...adj, [field]: value }
        : adj
    ))
    setHasChanges(true)
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Alta</Badge>
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-600"><Info className="h-3 w-3 mr-1" />Média</Badge>
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Baixa</Badge>
    }
  }

  const handleConfirm = () => {
    onConfirm(adjustments)
  }

  const handleAutoConfirm = () => {
    // Usar sugestões automáticas sem alterações
    onConfirm(adjustments)
  }

  if (!analysisResult) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar Tipos de Dados</DialogTitle>
          <DialogDescription>
            Revise e ajuste os tipos de dados detectados automaticamente. 
            Colunas com baixa confiança precisam de atenção especial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analysisResult.total_columns}</div>
              <div className="text-sm text-muted-foreground">Colunas</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analysisResult.total_rows.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Registros</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {analysisResult.columns.filter(col => col.confidence < 0.8).length}
              </div>
              <div className="text-sm text-muted-foreground">Requerem Atenção</div>
            </div>
          </div>

          {/* Tabela de Configuração */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coluna</TableHead>
                  <TableHead>Tipo Detectado</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead>Tipo Final</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Exemplos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResult.columns.map((column) => {
                  const adjustment = adjustments.find(adj => adj.column_index === column.index)
                  if (!adjustment) return null

                  return (
                    <TableRow key={column.index} className={column.confidence < 0.8 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                      <TableCell className="font-medium">
                        {column.name}
                        {column.issues.length > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            {column.issues[0]}
                          </p>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="capitalize">{column.suggested_type}</span>
                      </TableCell>
                      
                      <TableCell>
                        {getConfidenceBadge(column.confidence)}
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={adjustment.data_type}
                          onValueChange={(value: DataType) => 
                            updateAdjustment(column.index, 'data_type', value)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div>{option.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={adjustment.is_required}
                            onCheckedChange={(checked) => 
                              updateAdjustment(column.index, 'is_required', checked)
                            }
                          />
                          <Label className="text-xs">Obrigatório</Label>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {column.sample_values.slice(0, 3).map((value, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                              {value || '<vazio>'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Preview dos Dados */}
          {analysisResult.sample_rows.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Preview dos Dados</h3>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {analysisResult.columns.map(col => (
                        <TableHead key={col.index}>{col.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResult.sample_rows.slice(0, 3).map((row, idx) => (
                      <TableRow key={idx}>
                        {analysisResult.columns.map(col => (
                          <TableCell key={col.index} className="font-mono text-xs">
                            {row[col.name] || '<vazio>'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          
          {!hasChanges && (
            <Button onClick={handleAutoConfirm} disabled={isProcessing}>
              Usar Sugestões Automáticas
            </Button>
          )}
          
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processando...' : 'Confirmar e Processar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}