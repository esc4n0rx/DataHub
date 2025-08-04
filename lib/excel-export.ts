import * as XLSX from 'xlsx'
import { DatasetColumnInfo, DatasetRowData } from '@/types/reports'

export class ExcelExporter {
  static async exportDataset(
    datasetName: string,
    columns: DatasetColumnInfo[],
    rows: DatasetRowData[]
  ): Promise<void> {
    try {
      // Ordenar colunas por índice
      const sortedColumns = [...columns].sort((a, b) => a.column_index - b.column_index)
      
      // Criar headers
      const headers = sortedColumns.map(col => col.column_name)
      
      // Preparar dados
      const data = rows.map(row => {
        const rowData: any[] = []
        sortedColumns.forEach(col => {
          const value = row.data[col.column_name]
          rowData.push(this.formatValue(value, col.data_type))
        })
        return rowData
      })

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

      // Aplicar formatação
      this.formatWorksheet(ws, sortedColumns, data.length)

      // Criar workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dados')

      // Adicionar metadados
      this.addMetadataSheet(wb, {
        nome: datasetName,
        total_registros: rows.length,
        total_colunas: columns.length,
        data_exportacao: new Date().toLocaleString('pt-BR'),
        colunas: sortedColumns.map(col => ({
          nome: col.column_name,
          tipo: col.data_type,
          obrigatorio: col.is_required
        }))
      })

      // Download
      const fileName = `${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      throw new Error('Falha ao gerar arquivo Excel')
    }
  }

  private static formatValue(value: any, dataType: string): any {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    switch (dataType) {
      case 'number':
        const num = parseFloat(value)
        return isNaN(num) ? value : num
      
      case 'date':
        const date = new Date(value)
        return isNaN(date.getTime()) ? value : date
      
      case 'boolean':
        if (typeof value === 'boolean') return value
        const strValue = String(value).toLowerCase()
        if (['true', '1', 'sim', 'yes'].includes(strValue)) return true
        if (['false', '0', 'não', 'no'].includes(strValue)) return false
        return value
      
      default:
        return String(value)
    }
  }

  private static formatWorksheet(ws: XLSX.WorkSheet, columns: DatasetColumnInfo[], dataLength: number): void {
    // Definir larguras das colunas
    const colWidths = columns.map(col => {
      const baseWidth = Math.max(col.column_name.length, 10)
      return { width: Math.min(baseWidth + 5, 50) }
    })
    ws['!cols'] = colWidths

    // Congelar primeira linha
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }

    // Aplicar estilos ao header
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "366092" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }
    }
  }

  private static addMetadataSheet(wb: XLSX.WorkBook, metadata: any): void {
    const metadataData = [
      ['Dataset', metadata.nome],
      ['Data de Exportação', metadata.data_exportacao],
      ['Total de Registros', metadata.total_registros],
      ['Total de Colunas', metadata.total_colunas],
      [''],
      ['Informações das Colunas'],
      ['Nome', 'Tipo', 'Obrigatório'],
      ...metadata.colunas.map((col: any) => [
        col.nome,
        col.tipo,
        col.obrigatorio ? 'Sim' : 'Não'
      ])
    ]

    const metaWs = XLSX.utils.aoa_to_sheet(metadataData)
    XLSX.utils.book_append_sheet(wb, metaWs, 'Metadados')
  }
}