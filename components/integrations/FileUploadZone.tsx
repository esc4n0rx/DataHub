"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadZoneProps {
  integrationId?: string
  onUploadComplete?: (result: any) => void
}

interface UploadFile extends File {
  id: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

export function FileUploadZone({ integrationId, onUploadComplete }: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      status: 'pending' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt'],
      'application/json': ['.json']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (const file of files) {
      if (file.status !== 'pending') continue

      try {
        // Atualizar status para uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ))

        // Preparar FormData
        const formData = new FormData()
        formData.append('file', file)
        if (integrationId) {
          formData.append('integration_id', integrationId)
        }

        // Upload com progress
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { ...f, progress }
                : f
            ))
          }
        })

        const uploadPromise = new Promise<any>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error(xhr.responseText))
            }
          }
          xhr.onerror = () => reject(new Error('Erro de rede'))
        })

        xhr.open('POST', '/api/integrations/upload')
        xhr.send(formData)

        const result = await uploadPromise

        // Marcar como completo
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ))

        onUploadComplete?.(result)

      } catch (error: any) {
        console.error('Erro no upload:', error)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error.message || 'Erro desconhecido'
              }
            : f
        ))

        toast({
          title: "Erro no Upload",
          description: `Falha ao enviar ${file.name}: ${error.message}`,
          variant: "destructive"
        })
      }
    }

    setUploading(false)
  }

  const getFileIcon = (file: File) => {
    if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />
    }
    return <FileSpreadsheet className="h-8 w-8 text-blue-600" />
  }

  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  return (
    <div className="space-y-4">
      {/* Zona de Drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">
              <span className="font-medium">Clique para selecionar</span> ou arraste arquivos aqui
            </p>
            <p className="text-sm text-muted-foreground">
              Suporta CSV, Excel (.xlsx, .xls), TXT e JSON até 50MB
            </p>
          </div>
        )}
      </div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Arquivos Selecionados ({files.length})
            </h3>
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.every(f => f.status !== 'pending')}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Arquivos
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        {getStatusIcon(file)}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2 h-2" />
                      )}
                      
                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>

                    {(file.status === 'pending' || file.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}