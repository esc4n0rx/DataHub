"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UploadLog } from '@/types/upload'
import { Info, AlertTriangle, AlertCircle, RefreshCw, Clock } from 'lucide-react'

interface UploadLogsProps {
  datasetId?: string
  logs: UploadLog[]
  onRefresh?: () => void
  isLoading?: boolean
}

const LOG_LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: 'bg-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-yellow-600',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  error: {
    icon: AlertCircle,
    color: 'bg-red-600',
    textColor: 'text-red-700 dark:text-red-300'
  }
}

export function UploadLogs({ datasetId, logs, onRefresh, isLoading }: UploadLogsProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    if (autoRefresh && onRefresh && datasetId) {
      const interval = setInterval(onRefresh, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, onRefresh, datasetId])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getLogsByLevel = (level: UploadLog['level']) => {
    return logs.filter(log => log.level === level)
  }

  if (!datasetId && logs.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Logs do Upload</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Contador de Logs por Nível */}
            <div className="flex space-x-1">
              {getLogsByLevel('error').length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {getLogsByLevel('error').length} erros
                </Badge>
              )}
              {getLogsByLevel('warning').length > 0 && (
                <Badge className="bg-yellow-600 text-xs">
                  {getLogsByLevel('warning').length} avisos
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {getLogsByLevel('info').length} info
              </Badge>
            </div>
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum log disponível</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {logs.map((log) => {
                const config = LOG_LEVEL_CONFIG[log.level]
                const Icon = config.icon

                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${config.textColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{log.message}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${config.color} text-xs`}>
                            {log.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <pre className="whitespace-pre-wrap font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}