// lib/server-upload-analyzer.ts (CORRIGIDO)
import * as XLSX from 'xlsx'
import { DataType, ColumnAnalysis } from '@/types/upload'

export class ServerUploadAnalyzer {
  private static readonly SAMPLE_SIZE = 100
  private static readonly MIN_CONFIDENCE = 0.7

  /**
   * Analisa arquivo no servidor (Node.js)
   */
  static async analyzeFile(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  }> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    // Converter File para Buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    if (extension === 'csv') {
      return this.analyzeCsvFromBuffer(uint8Array, file.name)
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      return this.analyzeExcelFromBuffer(uint8Array)
    } else {
      throw new Error('Formato de arquivo não suportado. Use CSV ou Excel.')
    }
  }

  /**
   * Analisa CSV a partir de buffer (servidor)
   */
  private static analyzeCsvFromBuffer(buffer: Uint8Array, fileName: string): {
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  } {
    try {
      // Converter buffer para string
      const csvText = new TextDecoder('utf-8').decode(buffer)
      
      // Detectar separador
      const separator = this.detectCsvSeparator(csvText)
      
      // Dividir em linhas
      const lines = csvText.split('\n').map(line => line.trim()).filter(line => line)
      
      if (lines.length === 0) {
        throw new Error('Arquivo CSV está vazio')
      }

      // Primeira linha são os cabeçalhos
      const headers = this.parseCsvLine(lines[0], separator)
      
      if (headers.length === 0) {
        throw new Error('Não foi possível identificar colunas no CSV')
      }

      // Processar linhas de dados
      const data: Record<string, any>[] = []
      const maxRows = Math.min(lines.length - 1, this.SAMPLE_SIZE)
      
      for (let i = 1; i <= maxRows; i++) {
        if (i >= lines.length) break
        
        try {
          const values = this.parseCsvLine(lines[i], separator)
          const row: Record<string, any> = {}
          
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          
          data.push(row)
        } catch (error) {
          console.warn(`Erro ao processar linha ${i + 1}:`, error)
          // Continua processando outras linhas
        }
      }

      console.log(`CSV analisado: ${headers.length} colunas, ${data.length} registros de amostra, ${lines.length - 1} total`)

      return {
        headers,
        data,
        totalRows: lines.length - 1 // Menos o cabeçalho
      }
    } catch (error) {
      console.error('Erro ao analisar CSV:', error)
      throw new Error(`Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Analisa Excel a partir de buffer (servidor)
   */
  private static analyzeExcelFromBuffer(buffer: Uint8Array): {
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  } {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' })
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Arquivo Excel não contém planilhas')
      }

      // Usar primeira planilha
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Converter para JSON com cabeçalhos
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false, // Converter para strings
        defval: '' // Valor padrão para células vazias
      }) as any[][]

      if (jsonData.length === 0) {
        throw new Error('Planilha Excel está vazia')
      }

      // Primeira linha são os cabeçalhos
      const headers = (jsonData[0] || []).map((h: any) => String(h).trim()).filter(h => h)
      
      if (headers.length === 0) {
        throw new Error('Não foi possível identificar colunas na planilha')
      }

      // Processar dados
      const data: Record<string, any>[] = []
      const maxRows = Math.min(jsonData.length - 1, this.SAMPLE_SIZE)
      
      for (let i = 1; i <= maxRows; i++) {
        if (i >= jsonData.length) break
        
        const values = jsonData[i] || []
        const row: Record<string, any> = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] ? String(values[index]).trim() : ''
        })
        
        data.push(row)
      }

      console.log(`Excel analisado: ${headers.length} colunas, ${data.length} registros de amostra, ${jsonData.length - 1} total`)

      return {
        headers,
        data,
        totalRows: jsonData.length - 1 // Menos o cabeçalho
      }
    } catch (error) {
      console.error('Erro ao analisar Excel:', error)
      throw new Error(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Detecta separador CSV
   */
  private static detectCsvSeparator(csvText: string): string {
    const separators = [',', ';', '\t', '|']
    const firstLine = csvText.split('\n')[0] || ''
    
    let bestSeparator = ','
    let maxCount = 0
    
    for (const sep of separators) {
      const count = (firstLine.match(new RegExp(`\\${sep}`, 'g')) || []).length
      if (count > maxCount) {
        maxCount = count
        bestSeparator = sep
      }
    }
    
    return bestSeparator
  }

  /**
   * Faz parse de uma linha CSV respeitando aspas
   */
  private static parseCsvLine(line: string, separator: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Aspas duplas escapadas
          current += '"'
          i += 2
        } else {
          // Início/fim de aspas
          inQuotes = !inQuotes
          i++
        }
      } else if (char === separator && !inQuotes) {
        // Separador fora de aspas
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * Analisa tipos de dados das colunas (CORRIGIDO com propriedade issues)
   */
  static analyzeColumns(headers: string[], data: Record<string, any>[]): ColumnAnalysis[] {
    return headers.map((header, index) => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '')
      const stringValues = values.map(val => String(val).trim()).filter(val => val)
      
      if (stringValues.length === 0) {
        return {
          name: header,
          index,
          suggested_type: 'text',
          confidence: 1,
          sample_values: [],
          null_count: data.length,
          unique_count: 0,
          issues: ['Coluna vazia'] // CORRIGIDO: propriedade issues adicionada
        }
      }

      const typeAnalysis = this.detectDataType(stringValues)
      const uniqueValues = [...new Set(stringValues)]
      
      return {
        name: header,
        index,
        suggested_type: typeAnalysis.type,
        confidence: typeAnalysis.confidence,
        sample_values: uniqueValues.slice(0, 5),
        null_count: data.length - stringValues.length,
        unique_count: uniqueValues.length,
        issues: typeAnalysis.issues // CORRIGIDO: propriedade issues adicionada
      }
    })
  }

  /**
   * Detecta tipo de dados (CORRIGIDO para retornar issues)
   */
  private static detectDataType(stringValues: string[]): { type: DataType; confidence: number; issues: string[] } {
    if (stringValues.length === 0) {
      return { type: 'text', confidence: 1, issues: ['Coluna vazia'] }
    }

    const issues: string[] = []

    // Testa número
    const numberPattern = /^-?\d+(\.\d+)?$/
    const numberMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      return trimmed && numberPattern.test(trimmed)
    }).length
    const numberConfidence = numberMatches / stringValues.length

    // Testa data
    const dateMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      if (!trimmed) return false
      const parsed = Date.parse(trimmed)
      return !isNaN(parsed) && parsed > 0
    }).length
    const dateConfidence = dateMatches / stringValues.length

    // Testa email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailMatches = stringValues.filter(val => {
      const trimmed = val.trim()
      return trimmed && emailPattern.test(trimmed)
    }).length
    const emailConfidence = emailMatches / stringValues.length

    // Testa telefone
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

    // Testa boolean
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

    // Se confiança muito baixa, usa texto
    if (bestMatch.confidence < this.MIN_CONFIDENCE) {
      issues.push(`Baixa confiança para detecção automática de tipo`)
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

  /**
   * Processa arquivo completo (não apenas amostra)
   */
  static async analyzeFullFile(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  }> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    if (extension === 'csv') {
      return this.analyzeFullCsvFromBuffer(uint8Array)
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      return this.analyzeFullExcelFromBuffer(uint8Array)
    } else {
      throw new Error('Formato de arquivo não suportado')
    }
  }

  /**
   * Analisa CSV completo (todas as linhas)
   */
  private static analyzeFullCsvFromBuffer(buffer: Uint8Array): {
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  } {
    const csvText = new TextDecoder('utf-8').decode(buffer)
    const separator = this.detectCsvSeparator(csvText)
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line)
    
    if (lines.length === 0) {
      throw new Error('Arquivo CSV está vazio')
    }

    const headers = this.parseCsvLine(lines[0], separator)
    const data: Record<string, any>[] = []
    
    // Processar TODAS as linhas
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i], separator)
        const row: Record<string, any> = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        
        data.push(row)
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 1}:`, error)
      }
    }

    return {
      headers,
      data,
      totalRows: data.length
    }
  }

  /**
   * Analisa Excel completo (todas as linhas)
   */
  private static analyzeFullExcelFromBuffer(buffer: Uint8Array): {
    headers: string[]
    data: Record<string, any>[]
    totalRows: number
  } {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      defval: ''
    }) as any[][]

    const headers = (jsonData[0] || []).map((h: any) => String(h).trim()).filter(h => h)
    const data: Record<string, any>[] = []
    
    // Processar TODAS as linhas
    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i] || []
      const row: Record<string, any> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] ? String(values[index]).trim() : ''
      })
      
      data.push(row)
    }

    return {
      headers,
      data,
      totalRows: data.length
    }
  }

  /**
   * Valida integridade dos dados (reutiliza lógica do UploadAnalyzer)
   */
  static validateDataIntegrity(columns: ColumnAnalysis[], data: Record<string, any>[]): string[] {
    const issues: string[] = []
    
    // Verifica colunas duplicadas
    const columnNames = columns.map(col => col.name)
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      issues.push(`Colunas duplicadas encontradas: ${duplicates.join(', ')}`)
    }

    // Verifica linhas com muitos valores vazios
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