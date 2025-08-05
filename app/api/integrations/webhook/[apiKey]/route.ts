// app/api/integrations/webhook/[apiKey]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { IntegrationProcessor } from '@/lib/integration-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { apiKey: string } }
) {
  let integrationId: string | null = null
  let runId: string | null = null
  
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

    integrationId = integration.id
    console.log(`[WEBHOOK] Integração encontrada: ${integration.name} (Tipo: ${integration.upload_type})`)

    // Validar content-type
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      console.error(`[WEBHOOK] Content-Type inválido`)
      return NextResponse.json({ 
        error: 'Content-Type deve ser multipart/form-data' 
      }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string

    if (!file) {
      console.error(`[WEBHOOK] Arquivo não fornecido`)
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    // Validar tamanho do arquivo (máximo 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[WEBHOOK] Arquivo muito grande: ${file.size} bytes`)
      return NextResponse.json({ 
        error: `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ]

    const allowedExtensions = ['csv', 'xlsx', 'xls', 'txt']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      console.error(`[WEBHOOK] Tipo de arquivo não suportado: ${file.type}, extensão: ${fileExtension}`)
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Use CSV ou Excel (.csv, .xlsx, .xls)' 
      }, { status: 400 })
    }

    console.log(`[WEBHOOK] Arquivo válido recebido: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type})`)

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

    runId = run.id
    console.log(`[WEBHOOK] Execução criada: ${run.id}`)

    let uploadData: any = null
    const startTime = Date.now()

    try {
      // Upload temporário do arquivo para processamento
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data: tempUploadData, error: uploadError } = await supabaseAdmin.storage
        .from('integration-files')
        .upload(`temp/${integration.id}/${fileName}`, file, {
          cacheControl: '0',
          upsert: false
        })

      if (uploadError) {
        console.error(`[WEBHOOK] Erro no upload temporário:`, uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      uploadData = tempUploadData
      console.log(`[WEBHOOK] Arquivo salvo temporariamente: ${uploadData.path}`)

      // Processar arquivo usando o IntegrationProcessor
      console.log(`[WEBHOOK] Iniciando processamento com tipo: ${integration.upload_type}`)
      
      const result = await IntegrationProcessor.processFile(
        integration,
        run,
        file,
        source || 'webhook'
      )

      const processingTime = Date.now() - startTime
      console.log(`[WEBHOOK] Processamento concluído em ${processingTime}ms:`, result)

      // Atualizar execução como completa
      await supabaseAdmin
        .from('integration_runs')
        .update({
          status: 'completed',
          records_processed: result.recordsProcessed,
          completed_at: new Date().toISOString(),
          dataset_id: result.datasetId || null
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

      // Log de sucesso final
      await supabaseAdmin
        .from('integration_logs')
        .insert({
          integration_id: integration.id,
          run_id: run.id,
          level: 'info',
          message: `Processamento concluído com sucesso`,
          details: {
            source: source || 'webhook',
            file_name: file.name,
            file_size: file.size,
            records_processed: result.recordsProcessed,
            dataset_id: result.datasetId,
            upload_type: integration.upload_type,
            processing_time_ms: processingTime,
            file_extension: fileExtension,
            file_type: file.type
          }
        })

      console.log(`[WEBHOOK] Upload e processamento concluídos com sucesso`)

      return NextResponse.json({
        success: true,
        message: 'Arquivo recebido e processado com sucesso',
        data: {
          run_id: run.id,
          dataset_id: result.datasetId,
          records_processed: result.recordsProcessed,
          upload_type: integration.upload_type,
          processing_time_ms: processingTime,
          integration: {
            id: integration.id,
            name: integration.name,
            type: integration.type
          }
        }
      })

    } catch (error: any) {
      const processingTime = Date.now() - startTime
      console.error(`[WEBHOOK] Erro no processamento após ${processingTime}ms:`, error)
      
      // Categorizar tipos de erro
      let errorCategory = 'processing_error'
      let statusCode = 500
      
      if (error.message.includes('Formato de arquivo não suportado')) {
        errorCategory = 'file_format_error'
        statusCode = 400
      } else if (error.message.includes('FileReaderSync')) {
        errorCategory = 'server_compatibility_error'
        error.message = 'Erro de compatibilidade no processamento do arquivo'
      } else if (error.message.includes('Coleção não encontrada')) {
        errorCategory = 'configuration_error'
        statusCode = 422
      } else if (error.message.includes('não está configurada para upload fluido')) {
        errorCategory = 'configuration_error'
        statusCode = 422
      }
      
      // Atualizar execução como erro
      if (runId) {
        await supabaseAdmin
          .from('integration_runs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', runId)
      }

      // Log de erro detalhado
      if (integrationId && runId) {
        await supabaseAdmin
          .from('integration_logs')
          .insert({
            integration_id: integrationId,
            run_id: runId,
            level: 'error',
            message: `Erro ao processar arquivo: ${error.message}`,
            details: {
              error: error.message,
              error_category: errorCategory,
              stack: error.stack,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              upload_type: integration.upload_type,
              processing_time_ms: processingTime
            }
          })
      }

      return NextResponse.json({ 
        error: error.message,
        error_category: errorCategory,
        run_id: runId,
        processing_time_ms: processingTime
      }, { status: statusCode })

    } finally {
      // Limpar arquivo temporário do bucket
      if (uploadData) {
        console.log(`[WEBHOOK] Removendo arquivo temporário: ${uploadData.path}`)
        await IntegrationProcessor.cleanupFile(uploadData.path)
      }
    }

  } catch (error: any) {
    console.error('[WEBHOOK] Erro geral:', error)
    
    // Log de erro geral se possível
    if (integrationId && runId) {
      try {
        await supabaseAdmin
          .from('integration_logs')
          .insert({
            integration_id: integrationId,
            run_id: runId,
            level: 'error',
            message: `Erro geral no webhook: ${error.message}`,
            details: {
              error: error.message,
              stack: error.stack,
              error_category: 'webhook_error'
            }
          })
      } catch (logError) {
        console.error('[WEBHOOK] Erro ao salvar log:', logError)
      }
    }
    
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor',
      error_category: 'webhook_error'
    }, { status: 500 })
  }
}

// Configuração para aceitar arquivos grandes
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos