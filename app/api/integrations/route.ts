import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select(`
        *,
        integration_runs (
          status,
          completed_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(integrations || [])
  } catch (error: any) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Gerar API key única
    const apiKey = `dhub_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/webhook/${apiKey}`

    const insertData = {
      api_key: apiKey,
      webhook_url: webhookUrl,
      status: 'active',
      ...body
    }

    console.log('Inserindo integração via API:', insertData)

    const { data, error } = await supabase
      .from('integrations')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado na API:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar integração via API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}