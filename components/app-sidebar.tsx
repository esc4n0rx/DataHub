"use client"

import { Building2, BarChart3, Upload, FileText, History, Settings, Zap } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { ActivePage } from "./dashboard-layout"

const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    id: "dashboard" as ActivePage,
  },
  {
    title: "Upload de Dados",
    icon: Upload,
    id: "upload" as ActivePage,
  },
  {
    title: "Relatórios",
    icon: FileText,
    id: "reports" as ActivePage,
  },
  {
    title: "Integrações",
    icon: Zap,
    id: "integrations" as ActivePage,
  },
  {
    title: "Histórico",
    icon: History,
    id: "history" as ActivePage,
  },
  {
    title: "Configurações",
    icon: Settings,
    id: "settings" as ActivePage,
  },
]

interface AppSidebarProps {
  activePage: ActivePage
  onPageChange: (page: ActivePage) => void
}

export function AppSidebar({ activePage, onPageChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2 py-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">DataHub</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton onClick={() => onPageChange(item.id)} isActive={activePage === item.id}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">DataHub Enterprise v1.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}