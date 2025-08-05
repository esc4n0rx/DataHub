import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { apiKey: string } }
) {
  try {
    const apiKey = params.apiKey

    console.log(`[WEBHOOK] Recebendo requisição para API Key: ${apiKey}`)

    // Buscar integração pela API key
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single()

    if (integrationError || !integration) {
      console.error(`[WEBHOOK] Integração não encontrada:`, integrationError)
      return NextResponse.json({ 
        error: 'API Key inválida ou integração inativa' 
      }, { status: 401 })
    }

    console.log(`[WEBHOOK] Integração encontrada: ${integration.name}`)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string

    if (!file) {
      console.error(`[WEBHOOK] Arquivo não fornecido`)
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    console.log(`[WEBHOOK] Arquivo recebido: ${file.name} (${file.size} bytes)`)

    // Criar registro de execução
    const { data: run, error: runError } = await supabaseAdmin
      .from('integration_runs')
      .insert({
        integration_id: integration.id,
        status: 'running',
        file_name: file.name,
        file_size: file.size,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) {
      console.error(`[WEBHOOK] Erro ao criar execução:`, runError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    console.log(`[WEBHOOK] Execução criada: ${run.id}`)

    try {
      // Upload do arquivo
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('integration-files')
        .upload(`${integration.id}/${fileName}`, file)

      if (uploadError) {
        console.error(`[WEBHOOK] Erro no upload:`, uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      console.log(`[WEBHOOK] Arquivo salvo: ${uploadData.path}`)

      // Processar arquivo básico (você pode expandir isso)
      let recordsProcessed = 0
      if (file.name.endsWith('.csv')) {
        const fileText = await file.text()
        const lines = fileText.split('\n').filter(line => line.trim())
        recordsProcessed = Math.max(0, lines.length - 1) // Menos cabeçalho
      }

      // Atualizar execução como completa
      await supabaseAdmin
        .from('integration_runs')
        .update({
          status: 'completed',
          records_processed: recordsProcessed,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)

      // Atualizar última execução da integração
      await supabaseAdmin
        .from('integrations')
        .update({
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id)

      // Log de sucesso
      await supabaseAdmin
        .from('integration_logs')
        .insert({
          integration_id: integration.id,
          run_id: run.id,
          level: 'info',
          message: `Arquivo recebido via webhook: ${file.name}`,
          details: {
            source: source || 'webhook',
            file_name: file.name,
            file_size: file.size,
            records_processed: recordsProcessed,
            storage_path: uploadData.path
          }
        })

      console.log(`[WEBHOOK] Upload concluído com sucesso`)

      return NextResponse.json({
        success: true,
        run_id: run.id,
        records_processed: recordsProcessed,
        message: 'Arquivo recebido e processado com sucesso'
      })

    } catch (error: any) {
      console.error(`[WEBHOOK] Erro no processamento:`, error)
      
      // Atualizar execução como erro
      await supabaseAdmin
        .from('integration_runs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)

      // Log de erro
      await supabaseAdmin
        .from('integration_logs')
        .insert({
          integration_id: integration.id,
          run_id: run.id,
          level: 'error',
          message: `Erro ao processar arquivo via webhook: ${error.message}`
        })

      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[WEBHOOK] Erro geral:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 })
  }
}