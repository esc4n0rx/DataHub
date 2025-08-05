"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { UploadContent } from "@/components/upload-content"
import { ReportsContent } from "@/components/reports-content"
import { HistoryContent } from "@/components/history-content"
import { SettingsContent } from "@/components/settings-content"
import { IntegrationsContent } from "@/components/integrations-content"

export type ActivePage = "dashboard" | "upload" | "reports" | "history" | "settings" | "integrations"

export function DashboardLayout() {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard")

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardContent />
      case "upload":
        return <UploadContent />
      case "reports":
        return <ReportsContent />
      case "history":
        return <HistoryContent />
      case "settings":
        return <SettingsContent />
      case "integrations":
        return <IntegrationsContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar activePage={activePage} onPageChange={setActivePage} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </SidebarProvider>
  )
}