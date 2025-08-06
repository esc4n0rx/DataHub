// components/integrations/ConnectorEndpoint.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ConnectorsAPI } from "@/lib/connectors-api"
import { Connector, ConnectorEndpointInfo } from "@/types/connectors"
import { useToast } from "@/hooks/use-toast"
import { 
  Copy, 
  ExternalLink, 
  Database, 
  Code, 
  Eye,
  RefreshCw,
  Activity,
  Calendar
} from "lucide-react"

interface ConnectorEndpointProps {
  isOpen: boolean
  onClose: () => void
  connector: Connector
}

export function ConnectorEndpoint({ isOpen, onClose, connector }: ConnectorEndpointProps) {
  const [endpointInfo, setEndpointInfo] = useState<ConnectorEndpointInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadEndpointInfo = async () => {
    try {
      setLoading(true)
      const info = await ConnectorsAPI.getConnectorEndpointInfo(
        connector.integration_id,
        connector.api_key
      )
      setEndpointInfo(info)
    } catch (error) {
      console.error('Erro ao carregar informações do endpoint:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do endpoint",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEndpointInfo()
    }
  }, [isOpen])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`
    })
  }

  const openEndpoint = () => {
    window.open(connector.endpoint_url, '_blank')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateCurlExample = () => {
    return `curl -X GET "${connector.endpoint_url}" \\
  -H "Accept: application/${connector.data_format}"`
  }

  const generatePowerBIExample = () => {
    return `// Power BI - Web.Contents
let
    Source = Json.Document(
        Web.Contents("${connector.endpoint_url}")
    )
in
    Source`
  }

  const generatePythonExample = () => {
    return `import requests

# Fazer requisição ao conector
response = requests.get("${connector.endpoint_url}")

if response.status_code == 200:
    data = response.json()
    print(f"Registros obtidos: {len(data)}")
else:
    print(f"Erro: {response.status_code}")`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Endpoint: {connector.name}</span>
          </DialogTitle>
          <DialogDescription>
            Informações técnicas e exemplos de uso do conector
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="examples">Exemplos</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Informações básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações do Endpoint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={connector.is_active ? "bg-green-600" : "bg-gray-600"}>
                          {connector.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Formato</label>
                      <div className="mt-1">
                        <Badge variant="outline">{connector.data_format.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cache</label>
                      <p className="text-sm">{connector.refresh_interval} minutos</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Acessos</label>
                      <p className="text-sm">{connector.access_count} requisições</p>
                    </div>
                  </div>

                  <Separator />

                  {/* URL e API Key */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">URL do Endpoint</label>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(connector.endpoint_url, "URL")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openEndpoint}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir
                          </Button>
                        </div>
                      </div>
                      <code className="block p-3 bg-muted rounded text-xs break-all">
                        {connector.endpoint_url}
                      </code>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">API Key</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(connector.api_key, "API Key")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <code className="block p-3 bg-muted rounded text-xs break-all">
                        {connector.api_key}
                      </code>
                    </div>
                  </div>

                  <Separator />

                  {/* Informações de tempo */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Último Acesso</label>
                      <p>{formatDate(connector.last_accessed_at)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Última Atualização</label>
                      <p>{formatDate(endpointInfo?.last_updated || null)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Dados Disponíveis</span>
                  </CardTitle>
                  <CardDescription>
                    Informações sobre os dados retornados pelo endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {endpointInfo ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total de Registros</span>
                        <Badge variant="outline">{endpointInfo.total_records}</Badge>
                      </div>

                      {endpointInfo.sample_response.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Amostra dos Dados</label>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-60">
                            {JSON.stringify(endpointInfo.sample_response.slice(0, 3), null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Última atualização: {formatDate(endpointInfo.last_updated)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto mb-2" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              {/* cURL Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">cURL</CardTitle>
                  <CardDescription>Exemplo usando linha de comando</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(generateCurlExample(), "Comando cURL")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                      <code>{generateCurlExample()}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Power BI Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Power BI</CardTitle>
                  <CardDescription>Conectar usando Power Query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(generatePowerBIExample(), "Código Power BI")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                      <code>{generatePowerBIExample()}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Python Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Python</CardTitle>
                  <CardDescription>Exemplo usando requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(generatePythonExample(), "Código Python")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                      <code>{generatePythonExample()}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Schema dos Dados</span>
                  </CardTitle>
                  <CardDescription>
                    Estrutura dos dados retornados pelo endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {endpointInfo?.schema ? (
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                      <code>{JSON.stringify(endpointInfo.schema, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-2" />
                      <p>Schema não disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}