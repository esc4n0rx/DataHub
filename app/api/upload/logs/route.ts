import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { UploadAPI } from '@/lib/upload-api'

export async function GET(request: NextRequest) {
  try {
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

    // Obter dataset ID da query string
    const { searchParams } = new URL(request.url)
    const datasetId = searchParams.get('datasetId')

    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o dataset pertence ao usuário
    const dataset = await UploadAPI.getDataset(datasetId)
    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset não encontrado' },
        { status: 404 }
      )
    }

    if (dataset.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar logs
    const logs = await UploadAPI.getLogs(datasetId)

    return NextResponse.json({ 
      success: true, 
      logs 
    })

  } catch (error) {
    console.error('Erro na API de logs:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}