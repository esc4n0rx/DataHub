"use client"

import { Button } from '@/components/ui/button'
import { ReportsNavigation as ReportsNavigationType } from '@/types/reports-enhanced'
import { ChevronRight, Home } from 'lucide-react'

interface ReportsNavigationProps {
  navigation: ReportsNavigationType
  onNavigate: (type: 'overview' | 'collection' | 'dataset', id?: string) => void
}

export function ReportsNavigation({ navigation, onNavigate }: ReportsNavigationProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('overview')}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4 mr-1" />
        Relatórios
      </Button>
      
      {navigation.path.slice(1).map((item, index) => (
        <div key={`${item.type}-${item.id || 'root'}`} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.type as any, item.id)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            disabled={index === navigation.path.length - 2} // Último item não é clicável
          >
            {item.name}
          </Button>
        </div>
      ))}
    </nav>
  )
}