import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getStoredAuthData } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const authData = getStoredAuthData()
    if (!authData?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const integrationId = formData.get('integration_id') as string

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'application/json'
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|txt|json)$/i)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Use CSV, Excel, TXT ou JSON' 
      }, { status: 400 })
    }

    // Criar registro de execução
    const { data: run, error: runError } = await supabase
      .from('integration_runs')
      .insert({
        integration_id: integrationId || null,
        status: 'running',
        file_name: file.name,
        file_size: file.size,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) {
      console.error('Erro ao criar execução:', runError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    try {
      // Upload do arquivo para o bucket do Supabase
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('integration-files')
        .upload(`temp/${fileName}`, file)

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      // Processar arquivo baseado no tipo
      let processedData: any = {}
      const fileBuffer = await file.arrayBuffer()

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Processar CSV
        const csvText = new TextDecoder().decode(fileBuffer)
        const lines = csvText.split('\n').filter(line => line.trim())
        processedData = {
          type: 'csv',
          rows: lines.length - 1, // Menos o cabeçalho
          columns: lines[0]?.split(',').length || 0,
          preview: lines.slice(0, 5)
        }
      } else if (file.name.match(/\.(xlsx|xls)$/i)) {
        // Processar Excel
        const workbook = XLSX.read(fileBuffer)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        processedData = {
          type: 'excel',
          sheets: workbook.SheetNames.length,
          rows: jsonData.length - 1,
          columns: (jsonData[0] as any[])?.length || 0,
          preview: jsonData.slice(0, 5)
        }
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // Processar JSON
        const jsonText = new TextDecoder().decode(fileBuffer)
        const jsonData = JSON.parse(jsonText)
        
        processedData = {
          type: 'json',
          structure: Array.isArray(jsonData) ? 'array' : 'object',
          items: Array.isArray(jsonData) ? jsonData.length : 1,
          preview: Array.isArray(jsonData) ? jsonData.slice(0, 3) : jsonData
        }
      }

      // Atualizar execução como completa
      await supabase
        .from('integration_runs')
        .update({
          status: 'completed',
          records_processed: processedData.rows || processedData.items || 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)

      // Log de sucesso
      await supabase
        .from('integration_logs')
        .insert({
          integration_id: integrationId || null,
          run_id: run.id,
          level: 'info',
          message: `Arquivo ${file.name} processado com sucesso`,
          details: {
            file_name: file.name,
            file_size: file.size,
            processed_data: processedData,
            storage_path: uploadData.path
          }
        })

      // Agendar limpeza do arquivo temporário
      setTimeout(async () => {
        try {
          await supabase.storage
            .from('integration-files')
            .remove([uploadData.path])
        } catch (error) {
          console.error('Erro ao limpar arquivo temporário:', error)
        }
      }, 24 * 60 * 60 * 1000) // 24 horas

      return NextResponse.json({
        success: true,
        run_id: run.id,
        processed_data: processedData,
        message: 'Arquivo processado com sucesso'
      })

    } catch (error: any) {
      // Atualizar execução como erro
      await supabase
        .from('integration_runs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)

      // Log de erro
      await supabase
        .from('integration_logs')
        .insert({
          integration_id: integrationId || null,
          run_id: run.id,
          level: 'error',
          message: `Erro ao processar arquivo ${file.name}: ${error.message}`,
          details: { error: error.message }
        })

      throw error
    }

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 })
  }
}