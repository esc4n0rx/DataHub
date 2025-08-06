// app/api/connectors/[integrationId]/schema/route.ts
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

    // Verificar conector
    const connector = await ConnectorsAPI.getConnectorByApiKey(apiKey)
    
    if (!connector || !connector.is_active) {
      return NextResponse.json(
        { error: 'Conector não encontrado ou inativo' },
        { status: 404 }
      )
    }

    if (connector.integration_id !== integrationId) {
      return NextResponse.json(
        { error: 'Conector não pertence a esta integração' },
        { status: 403 }
      )
    }

    // Buscar run mais recente para obter schema
    const { data: latestRun, error: runError } = await supabaseAdmin
      .from('integration_runs')
      .select('dataset_id, created_at')
      .eq('integration_id', integrationId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (runError || !latestRun?.dataset_id) {
      return NextResponse.json(
        { error: 'Nenhum schema disponível' },
        { status: 404 }
      )
    }

    // Buscar schema do dataset
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('dataset_columns')
      .select('*')
      .eq('dataset_id', latestRun.dataset_id)
      .order('column_index')

    if (columnsError) {
      console.error('Erro ao buscar colunas:', columnsError)
      return NextResponse.json(
        { error: 'Erro ao buscar schema' },
        { status: 500 }
      )
    }

    // Montar schema
    const schema = {
      fields: (columns || []).map(column => ({
        name: column.column_name,
        type: column.data_type,
        required: column.is_required,
        sample_values: column.sample_values
      })),
      meta: {
        total_fields: columns?.length || 0,
        integration_id: integrationId,
        connector_id: connector.id,
        last_updated: latestRun.created_at
      }
    }

    return NextResponse.json(schema, {
      headers: {
        'Cache-Control': `public, max-age=${connector.refresh_interval * 60}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Erro na API de schema do conector:', error)
    
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