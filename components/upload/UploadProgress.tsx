"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { UploadProgress as UploadProgressType } from '@/types/upload'
import { 
  Upload, 
  Search, 
  Settings, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'

interface UploadProgressProps {
  progress: UploadProgressType | null
}

const PHASE_CONFIG = {
  uploading: {
    icon: Upload,
    label: 'Upload',
    description: 'Enviando arquivo...',
    color: 'bg-blue-600'
  },
  analyzing: {
    icon: Search,
    label: 'Análise',
    description: 'Analisando estrutura e tipos de dados...',
    color: 'bg-orange-600'
  },
  adjusting: {
    icon: Settings,
    label: 'Ajustes',
    description: 'Aguardando configurações...',
    color: 'bg-yellow-600'
  },
  processing: {
    icon: Database,
    label: 'Processamento',
    description: 'Salvando dados no sistema...',
    color: 'bg-purple-600'
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluído',
    description: 'Upload realizado com sucesso!',
    color: 'bg-green-600'
  },
  error: {
    icon: AlertCircle,
    label: 'Erro',
    description: 'Ocorreu um erro durante o processo',
    color: 'bg-red-600'
  }
}

export function UploadProgress({ progress }: UploadProgressProps) {
  if (!progress) return null

  const config = PHASE_CONFIG[progress.phase]
  const Icon = config.icon
  const isActive = !['completed', 'error'].includes(progress.phase)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isActive ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
            <span>Status do Upload</span>
          </div>
          <Badge className={config.color}>
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.message}</span>
            <span>{progress.progress}%</span>
          </div>
          <Progress 
            value={progress.progress} 
            className={progress.phase === 'error' ? 'bg-red-100' : ''}
          />
        </div>

        {/* Timeline das Fases */}
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(PHASE_CONFIG).filter(([key]) => key !== 'error').map(([phase, phaseConfig], index) => {
            const PhaseIcon = phaseConfig.icon
            const isCurrentPhase = progress.phase === phase
            const isCompletedPhase = ['completed'].includes(progress.phase) || 
              (Object.keys(PHASE_CONFIG).indexOf(phase) < Object.keys(PHASE_CONFIG).indexOf(progress.phase))
            
            return (
              <div 
                key={phase}
                className={`flex flex-col items-center p-2 rounded-lg text-center ${
                  isCurrentPhase 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompletedPhase 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <PhaseIcon className="h-4 w-4 mb-1" />
                <span className="text-xs font-medium">{phaseConfig.label}</span>
              </div>
            )
          })}
        </div>

        {/* Dataset ID (se disponível) */}
        {progress.dataset_id && (
          <div className="text-xs text-muted-foreground">
            Dataset ID: <code className="bg-muted px-2 py-1 rounded">{progress.dataset_id}</code>
          </div>
        )}

        {/* Mensagem de Erro */}
        {progress.phase === 'error' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Erro no Upload</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {progress.message}
            </p>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {progress.phase === 'completed' && (
          <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Upload Concluído</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {progress.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}