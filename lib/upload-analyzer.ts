import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { DataType, ColumnAnalysis } from '@/types/upload'

export class UploadAnalyzer {
  private static readonly SAMPLE_SIZE = 100
  private static readonly MIN_CONFIDENCE = 0.7

  static async analyzeFile(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  }> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (extension === 'csv') {
      return this.analyzeCsv(file)
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      return this.analyzeExcel(file)
    } else {
      throw new Error('Formato de arquivo não suportado')
    }
  }

  private static async analyzeCsv(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: this.SAMPLE_SIZE,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Erro ao processar CSV: ${results.errors[0].message}`))
            return
          }

          const headers = results.meta.fields || []
          const data = results.data as Record<string, any>[]
          
          resolve({
            headers,
            data,
            totalRows: results.data.length
          })
        },
        error: (error) => {
          reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`))
        }
      })
    })
  }

  private static async analyzeExcel(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' })
          
          // Pega a primeira planilha
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Converte para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            defval: ''
          }) as any[][]
          
          if (jsonData.length === 0) {
            reject(new Error('Planilha vazia'))
            return
          }
          
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1, Math.min(this.SAMPLE_SIZE + 1, jsonData.length))
          
          // Converte para formato de objeto
          const data = rows.map((row, index) => {
            const obj: Record<string, any> = {}
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || ''
            })
            return obj
          })
          
          resolve({
            headers,
            data, // CORRIGIDO: era "new Uint8Array(...)" - deve retornar os dados processados
            totalRows: jsonData.length - 1 // -1 para excluir header
          })
        } catch (error) {
          reject(new Error(`Erro ao processar Excel: ${error}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  static analyzeColumns(headers: string[], data: Record<string, any>[]): ColumnAnalysis[] {
    return headers.map((header, index) => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '')
      const sampleValues = values.slice(0, 5).map(val => String(val)) // CORRIGIDO: garantir conversão para string
      
      const typeAnalysis = this.detectDataType(values)
      
      return {
        name: header,
        index,
        suggested_type: typeAnalysis.type,
        confidence: typeAnalysis.confidence,
        sample_values: sampleValues,
        issues: typeAnalysis.issues
      }
    })
  }

  private static detectDataType(values: any[]): {
    type: DataType
    confidence: number
    issues: string[]
  } {
    if (values.length === 0) {
      return { type: 'text', confidence: 0, issues: ['Coluna vazia'] }
    }

    // CORRIGIDO: Garantir que todos os valores sejam strings de forma segura
    const stringValues = values.map(val => {
      if (val === null || val === undefined) return ''
      return String(val)
    }).filter(val => val !== '') // Remove strings vazias após conversão

    if (stringValues.length === 0) {
      return { type: 'text', confidence: 0, issues: ['Coluna contém apenas valores vazios'] }
    }

    const issues: string[] = []

    // Testa número - CORRIGIDO: trim() agora é seguro
    const numberPattern = /^-?\d*\.?\d+$/
    const numberMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      return trimmed && numberPattern.test(trimmed)
    }).length
    const numberConfidence = numberMatches / stringValues.length

    // Testa data - CORRIGIDO: validação mais robusta
    const dateMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      if (!trimmed) return false
      const parsed = Date.parse(trimmed)
      return !isNaN(parsed) && parsed > 0
    }).length
    const dateConfidence = dateMatches / stringValues.length

    // Testa email - CORRIGIDO: trim() seguro
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      return trimmed && emailPattern.test(trimmed)
    }).length
    const emailConfidence = emailMatches / stringValues.length

    // Testa telefone - CORRIGIDO: tratamento mais cuidadoso
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
    const phoneMatches = stringValues.filter(val => {
      try {
        const cleaned = val.replace(/[\s\-\(\)]/g, '')
        return cleaned && phonePattern.test(cleaned)
      } catch {
        return false
      }
    }).length
    const phoneConfidence = phoneMatches / stringValues.length

    // Testa boolean - CORRIGIDO: trim() seguro
    const booleanValues = ['true', 'false', '1', '0', 'sim', 'não', 'yes', 'no']
    const booleanMatches = stringValues.filter(val => {
      try {
        const trimmed = val.trim().toLowerCase()
        return trimmed && booleanValues.includes(trimmed)
      } catch {
        return false
      }
    }).length
    const booleanConfidence = booleanMatches / stringValues.length

    // Determina o tipo com maior confiança
    const candidates = [
      { type: 'number' as DataType, confidence: numberConfidence },
      { type: 'date' as DataType, confidence: dateConfidence },
      { type: 'email' as DataType, confidence: emailConfidence },
      { type: 'phone' as DataType, confidence: phoneConfidence },
      { type: 'boolean' as DataType, confidence: booleanConfidence },
    ]

    const bestMatch = candidates.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )

    // Se nenhum tipo tem confiança suficiente, assume texto
    if (bestMatch.confidence < this.MIN_CONFIDENCE) {
      return { type: 'text', confidence: 1, issues }
    }

    // Adiciona issues baseado na confiança
    if (bestMatch.confidence < 0.9) {
      issues.push(`Confiança ${Math.round(bestMatch.confidence * 100)}% para tipo ${bestMatch.type}`)
    }

    return {
      type: bestMatch.type,
      confidence: bestMatch.confidence,
      issues
    }
  }

  static validateDataIntegrity(columns: ColumnAnalysis[], data: Record<string, any>[]): string[] {
    const issues: string[] = []
    
    // Verifica colunas duplicadas
    const columnNames = columns.map(col => col.name)
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      issues.push(`Colunas duplicadas encontradas: ${duplicates.join(', ')}`)
    }

    // Verifica linhas com muitos valores vazios - CORRIGIDO: tratamento seguro de valores
    const emptyThreshold = 0.5
    data.forEach((row, index) => {
      const totalFields = Object.keys(row).length
      if (totalFields === 0) return

      const emptyCount = Object.values(row).filter(val => {
        if (val === null || val === undefined) return true
        const strVal = String(val).trim()
        return strVal === '' || strVal === 'null' || strVal === 'undefined'
      }).length

      if (emptyCount / totalFields > emptyThreshold) {
        issues.push(`Linha ${index + 2} tem muitos campos vazios (${emptyCount}/${totalFields})`)
      }
    })

    return issues
  }
}