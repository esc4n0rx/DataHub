"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useUpload } from '@/hooks/use-upload'
import { UploadMode, FluidUploadConfig } from '@/types/collections'

interface FileAnalyzerProps {
  onAnalysisComplete?: () => void
  uploadMode: UploadMode
  fluidConfig?: FluidUploadConfig | null
}

export function FileAnalyzer({ onAnalysisComplete, uploadMode, fluidConfig }: FileAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [description, setDescription] = useState('')
  const { analyzeFile, isUploading, progress } = useUpload()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!datasetName) {
        const baseName = file.name.split('.')[0].replace(/[_-]/g, ' ')
        const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
        
        if (uploadMode.type === 'fluid') {
          setDatasetName(`${formattedName} (Fluido)`)
        } else if (uploadMode.type === 'collection') {
          setDatasetName(formattedName)
        } else {
          setDatasetName(formattedName)
        }
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !datasetName.trim()) return

    try {
      await analyzeFile(selectedFile, datasetName.trim(), {
        uploadMode,
        fluidConfig
      })
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

 const getModeDescription = () => {
   switch (uploadMode.type) {
     case 'individual':
       return 'Arquivo será processado como dataset independente'
     case 'collection':
       return `Arquivo será adicionado à coleção selecionada`
     case 'fluid':
       return 'Dados existentes serão substituídos pelos novos dados'
     default:
       return 'Selecione um modo de upload'
   }
 }

 const isReadyToAnalyze = () => {
   if (!selectedFile || !datasetName.trim()) return false
   
   if ((uploadMode.type === 'collection' || uploadMode.type === 'fluid') && !uploadMode.collection_id) {
     return false
   }
   
   if (uploadMode.type === 'fluid' && !fluidConfig) {
     return false
   }
   
   return true
 }

 return (
   <Card>
     <CardHeader>
       <CardTitle className="flex items-center space-x-2">
         <Upload className="h-5 w-5" />
         <span>Analisador de Arquivos</span>
       </CardTitle>
       <CardDescription>
         {getModeDescription()}
       </CardDescription>
     </CardHeader>
     <CardContent className="space-y-6">
       {/* Informações do Dataset */}
       <div className="grid gap-4 md:grid-cols-2">
         <div className="space-y-2">
           <Label htmlFor="dataset-name">Nome do Dataset *</Label>
           <Input
             id="dataset-name"
             placeholder={
               uploadMode.type === 'fluid' 
                 ? "Ex: Estoque Atual" 
                 : "Ex: Vendas Q4 2024"
             }
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
           placeholder={
             uploadMode.type === 'fluid'
               ? "Descreva os dados que serão atualizados..."
               : "Descreva o conteúdo deste dataset..."
           }
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
           disabled={!isReadyToAnalyze() || isUploading}
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

       {/* Instruções baseadas no modo */}
       <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
         <h4 className="font-medium text-foreground">
           {uploadMode.type === 'individual' && 'Upload Individual:'}
           {uploadMode.type === 'collection' && 'Upload em Coleção:'}
           {uploadMode.type === 'fluid' && 'Upload Fluido:'}
         </h4>
         <ul className="space-y-1 ml-4">
           {uploadMode.type === 'individual' && (
             <>
               <li>• Formatos aceitos: CSV, Excel (.xlsx, .xls)</li>
               <li>• Primeira linha deve conter os cabeçalhos das colunas</li>
               <li>• Tamanho máximo: 100MB por arquivo</li>
               <li>• Será criado um dataset independente</li>
             </>
           )}
           {uploadMode.type === 'collection' && (
             <>
               <li>• Arquivo será adicionado à coleção selecionada</li>
               <li>• Manterá histórico de todas as versões</li>
               <li>• Ideal para dados relacionados ao mesmo tema</li>
               <li>• Facilita organização e relatórios</li>
             </>
           )}
           {uploadMode.type === 'fluid' && (
             <>
               <li>• Substituirá os dados existentes na coleção</li>
               <li>• {fluidConfig?.preserve_schema ? 'Estrutura de colunas deve ser idêntica' : 'Estrutura pode variar'}</li>
               <li>• {fluidConfig?.backup_previous ? 'Versão anterior será arquivada' : 'Dados anteriores serão perdidos'}</li>
               <li>• Ideal para dashboards em tempo real</li>
             </>
           )}
         </ul>
       </div>

       {/* Avisos específicos por modo */}
       {uploadMode.type === 'fluid' && (
         <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
           <div className="text-sm text-orange-800 dark:text-orange-200">
             <strong>Atenção:</strong> Este é um upload fluido. 
             {fluidConfig?.backup_previous 
               ? ' A versão atual será arquivada antes da substituição.'
               : ' Os dados atuais serão permanentemente substituídos.'
             }
           </div>
         </div>
       )}

       {(uploadMode.type === 'collection' || uploadMode.type === 'fluid') && !uploadMode.collection_id && (
         <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
           <div className="text-sm text-yellow-800 dark:text-yellow-200">
             <strong>Selecione uma coleção</strong> antes de fazer o upload.
           </div>
         </div>
       )}
     </CardContent>
   </Card>
 )
}