// app/api/connectors/[integrationId]/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ConnectorsAPI } from '@/lib/connectors-api'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key é obrigatória' },
        { status: 401 }
      )
    }

    // Verificar se o conector existe e está ativo
    const connector = await ConnectorsAPI.getConnectorByApiKey(apiKey)
    
    if (!connector || !connector.is_active) {
      return NextResponse.json(
        { error: 'Conector não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Verificar se o conector pertence à integração solicitada
    if (connector.integration_id !== integrationId) {
      return NextResponse.json(
        { error: 'Conector não pertence a esta integração' },
        { status: 403 }
      )
    }

    // Incrementar contador de acesso (não bloquear se falhar)
    ConnectorsAPI.incrementAccessCount(connector.id).catch(console.error)

    // Buscar dados mais recentes da integração
    const { data: latestRun, error: runError } = await supabaseAdmin
      .from('integration_runs')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (runError || !latestRun) {
      return NextResponse.json(
        { error: 'Nenhum dado disponível para esta integração' },
        { status: 404 }
      )
    }

    // Buscar registros do dataset (tabela correta: dataset_rows)
    let records = []
    if (latestRun.dataset_id) {
      const { data: datasetRecords, error: recordsError } = await supabaseAdmin
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', latestRun.dataset_id)
        .order('row_index')

      if (recordsError) {
        console.error('Erro ao buscar registros:', recordsError)
        return NextResponse.json(
          { error: 'Erro ao buscar dados' },
          { status: 500 }
        )
      }

      records = datasetRecords?.map(record => record.data) || []
    }

    // Aplicar parâmetros de consulta opcionais
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    
    let filteredRecords = records
    
    if (offset) {
      const offsetNum = parseInt(offset, 10)
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        filteredRecords = filteredRecords.slice(offsetNum)
      }
    }
    
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredRecords = filteredRecords.slice(0, limitNum)
      }
    }

    // Buscar informações da integração
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('name')
      .eq('id', integrationId)
      .single()

    // Retornar dados no formato especificado
    const responseData = {
      data: filteredRecords,
      meta: {
        total_records: records.length,
        returned_records: filteredRecords.length,
        integration_name: integration?.name || 'N/A',
        last_updated: latestRun.completed_at,
        data_format: connector.data_format
      }
    }

    // Definir headers de response baseado no formato
    let responseHeaders: HeadersInit = {
      'Cache-Control': `public, max-age=${connector.refresh_interval * 60}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }

    // Retornar no formato solicitado
    switch (connector.data_format) {
      case 'csv':
        if (filteredRecords.length === 0) {
          return new Response('', {
            headers: { ...responseHeaders, 'Content-Type': 'text/csv' }
          })
        }
        
        const csvHeader = Object.keys(filteredRecords[0]).join(',')
        const csvRows = filteredRecords.map(record =>
          Object.values(record).map(value => 
            typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          ).join(',')
        )
        const csvContent = [csvHeader, ...csvRows].join('\n')
        
        return new Response(csvContent, {
          headers: { ...responseHeaders, 'Content-Type': 'text/csv' }
        })

      case 'xml':
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <meta>
    <total_records>${records.length}</total_records>
    <returned_records>${filteredRecords.length}</returned_records>
    <integration_name>${integration?.name || 'N/A'}</integration_name>
    <last_updated>${latestRun.completed_at}</last_updated>
  </meta>
  <data>
    ${filteredRecords.map(record => 
      `<record>${Object.entries(record).map(([key, value]) => 
        `<${key}>${value}</${key}>`
      ).join('')}</record>`
    ).join('')}
  </data>
</response>`
        
        return new Response(xmlContent, {
          headers: { ...responseHeaders, 'Content-Type': 'application/xml' }
        })

      case 'json':
      default:
        return NextResponse.json(responseData, {
          headers: responseHeaders
        })
    }

  } catch (error) {
    console.error('Erro na API de dados do conector:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}