"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Bell, Shield, Download } from "lucide-react"

export function SettingsContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema e preferências</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Conexões</span>
            </CardTitle>
            <CardDescription>Configure as conexões com sistemas externos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sap-server">Servidor SAP</Label>
              <Input id="sap-server" placeholder="sap.empresa.com" defaultValue="sap.empresa.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sap-user">Usuário SAP</Label>
              <Input id="sap-user" placeholder="usuario_sap" defaultValue="datahub_user" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="db-connection">String de Conexão BD</Label>
              <Input
                id="db-connection"
                placeholder="postgresql://..."
                defaultValue="postgresql://localhost:5432/datahub"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sincronização Automática</Label>
                <p className="text-sm text-muted-foreground">Sincronizar dados automaticamente a cada 6 horas</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Button className="w-full">Testar Conexões</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </CardTitle>
            <CardDescription>Configure quando e como receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de Upload</Label>
                <p className="text-sm text-muted-foreground">Notificar quando arquivos forem enviados</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de Erro</Label>
                <p className="text-sm text-muted-foreground">Notificar quando ocorrerem erros</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatórios Semanais</Label>
                <p className="text-sm text-muted-foreground">Receber resumo semanal por email</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notification-email">Email para Notificações</Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="admin@empresa.com"
                defaultValue="admin@empresa.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Sistema</span>
            </CardTitle>
            <CardDescription>Configurações gerais do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select defaultValue="america-sao_paulo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-sao_paulo">América/São Paulo</SelectItem>
                  <SelectItem value="america-new_york">América/Nova York</SelectItem>
                  <SelectItem value="europe-london">Europa/Londres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select defaultValue="pt-br">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en-us">English (US)</SelectItem>
                  <SelectItem value="es-es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-file-size">Tamanho Máximo de Arquivo (MB)</Label>
              <Input id="max-file-size" type="number" defaultValue="10" min="1" max="100" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">Bloquear acesso para manutenção</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Segurança</span>
            </CardTitle>
            <CardDescription>Configurações de segurança e backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Backup diário às 03:00</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-retention">Retenção de Backup (dias)</Label>
              <Input id="backup-retention" type="number" defaultValue="30" min="7" max="365" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Log de Auditoria</Label>
                <p className="text-sm text-muted-foreground">Registrar todas as ações dos usuários</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Baixar Backup Manual
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Limpar Logs Antigos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salvar Configurações</CardTitle>
          <CardDescription>As alterações serão aplicadas imediatamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button>Salvar Alterações</Button>
            <Button variant="outline">Restaurar Padrões</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
