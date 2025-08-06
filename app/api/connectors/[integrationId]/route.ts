// app/api/connectors/[integrationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { ConnectorsAPI } from '@/lib/connectors-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await validateToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const connectors = await ConnectorsAPI.getConnectorsByIntegration(integrationId)

    return NextResponse.json({
      success: true,
      connectors
    })

  } catch (error) {
    console.error('Erro na API de conectores:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}