"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  onExportExcel: () => Promise<void>
  disabled?: boolean
}

export function ExportButton({ onExportExcel, disabled = false }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExportExcel = async () => {
    try {
      setLoading(true)
      await onExportExcel()
    } catch (error) {
      console.error('Erro no export:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportExcel} disabled={loading}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileText className="h-4 w-4 mr-2" />
          CSV (em breve)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}