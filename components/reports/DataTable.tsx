"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DatasetColumnInfo, DatasetRowData, DatasetFilters, PaginationState } from '@/types/reports'
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

interface DataTableProps {
  columns: DatasetColumnInfo[]
  rows: DatasetRowData[]
  filters: DatasetFilters
  pagination: PaginationState
  onFiltersChange: (filters: Partial<DatasetFilters>) => void
  onPaginationChange: (pagination: Partial<PaginationState>) => void
  onRefresh: () => void
  loading?: boolean
}

const DATA_TYPE_LABELS = {
  text: 'Texto',
  number: 'Número',
  date: 'Data',
  boolean: 'Booleano',
  email: 'Email',
  phone: 'Telefone'
}

export function DataTable({
  columns,
  rows,
  filters,
  pagination,
  onFiltersChange,
  onPaginationChange,
  onRefresh,
  loading = false
}: DataTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  const handleSearch = () => {
    onFiltersChange({ search: searchInput })
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    onFiltersChange({ search: '', column: null })
  }

  const formatCellValue = (value: any, dataType: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    try {
      switch (dataType) {
        case 'date':
          const date = new Date(value)
          return isNaN(date.getTime()) 
            ? String(value) 
            : date.toLocaleDateString('pt-BR')
        
        case 'number':
          const num = parseFloat(value)
          return isNaN(num) ? String(value) : num.toLocaleString('pt-BR')
        
        case 'boolean':
          if (typeof value === 'boolean') {
            return value ? 'Sim' : 'Não'
          }
          const strValue = String(value).toLowerCase()
          if (['true', '1', 'sim', 'yes'].includes(strValue)) return 'Sim'
          if (['false', '0', 'não', 'no'].includes(strValue)) return 'Não'
          return String(value)
        
        default:
          return String(value)
      }
    } catch {
      return String(value)
    }
  }

  const getTypeColor = (dataType: string): string => {
    const colors = {
      text: 'bg-gray-100 text-gray-700',
      number: 'bg-blue-100 text-blue-700',
      date: 'bg-green-100 text-green-700',
      boolean: 'bg-purple-100 text-purple-700',
      email: 'bg-orange-100 text-orange-700',
      phone: 'bg-pink-100 text-pink-700'
    }
    return colors[dataType as keyof typeof colors] || colors.text
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  const startRecord = (pagination.page - 1) * pagination.pageSize + 1
  const endRecord = Math.min(pagination.page * pagination.pageSize, pagination.total)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os dados..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-8"
            />
          </div>
        </div>
        
        <Select 
          value={filters.column || 'all'} 
          onValueChange={(value) => onFiltersChange({ column: value === 'all' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Buscar em coluna..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as colunas</SelectItem>
            {columns.map(col => (
              <SelectItem key={col.id} value={col.column_name}>
                {col.column_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Button onClick={handleSearch} className="flex-1">
            Buscar
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Informações da Tabela */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Mostrando {startRecord} a {endRecord} de {pagination.total.toLocaleString()} registros
        </div>
        <div className="flex items-center space-x-2">
          <span>Registros por página:</span>
          <Select 
            value={pagination.pageSize.toString()} 
            onValueChange={(value) => onPaginationChange({ pageSize: parseInt(value), page: 1 })}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              {columns.map(column => (
                <TableHead key={column.id} className="min-w-32">
                  <div className="space-y-1">
                    <div className="font-medium">{column.column_name}</div>
                    <div className="flex items-center space-x-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTypeColor(column.data_type)}`}
                      >
                        {DATA_TYPE_LABELS[column.data_type]}
                      </Badge>
                      {column.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(pagination.pageSize)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                 </TableCell>
                 {columns.map(col => (
                   <TableCell key={col.id}>
                     <div className="h-4 bg-muted rounded animate-pulse"></div>
                   </TableCell>
                 ))}
               </TableRow>
             ))
           ) : rows.length === 0 ? (
             <TableRow>
               <TableCell colSpan={columns.length + 1} className="text-center py-8">
                 <div className="text-muted-foreground">
                   {filters.search ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}
                 </div>
               </TableCell>
             </TableRow>
           ) : (
             rows.map((row) => (
               <TableRow key={row.id}>
                 <TableCell className="font-mono text-xs">
                   {row.row_index + 1}
                 </TableCell>
                 {columns.map(column => (
                   <TableCell key={column.id} className="max-w-xs">
                     <div className="truncate" title={String(row.data[column.column_name] || '')}>
                       {formatCellValue(row.data[column.column_name], column.data_type)}
                     </div>
                   </TableCell>
                 ))}
               </TableRow>
             ))
           )}
         </TableBody>
       </Table>
     </div>

     {/* Paginação */}
     {totalPages > 1 && (
       <div className="flex items-center justify-center space-x-2">
         <Button
           variant="outline"
           onClick={() => onPaginationChange({ page: pagination.page - 1 })}
           disabled={pagination.page <= 1 || loading}
         >
           <ChevronLeft className="h-4 w-4" />
           Anterior
         </Button>

         <div className="flex space-x-1">
           {[...Array(Math.min(5, totalPages))].map((_, i) => {
             let pageNum: number
             if (totalPages <= 5) {
               pageNum = i + 1
             } else if (pagination.page <= 3) {
               pageNum = i + 1
             } else if (pagination.page >= totalPages - 2) {
               pageNum = totalPages - 4 + i
             } else {
               pageNum = pagination.page - 2 + i
             }

             return (
               <Button
                 key={pageNum}
                 variant={pagination.page === pageNum ? "default" : "outline"}
                 size="sm"
                 onClick={() => onPaginationChange({ page: pageNum })}
                 disabled={loading}
               >
                 {pageNum}
               </Button>
             )
           })}
         </div>

         <Button
           variant="outline"
           onClick={() => onPaginationChange({ page: pagination.page + 1 })}
           disabled={pagination.page >= totalPages || loading}
         >
           Próxima
           <ChevronRight className="h-4 w-4" />
         </Button>
       </div>
     )}
   </div>
 )
}