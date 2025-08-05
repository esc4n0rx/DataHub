import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { CollectionsAPI } from '@/lib/collections-api'
import { CreateCollectionData } from '@/types/collections'

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

    const collections = await CollectionsAPI.getCollections()

    return NextResponse.json({ 
      success: true, 
      collections 
    })

  } catch (error) {
    console.error('Erro na API de coleções:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, category, is_fluid } = body as CreateCollectionData

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Nome e categoria são obrigatórios' },
        { status: 400 }
      )
    }

    const collectionId = await CollectionsAPI.createCollection({
      name,
      description,
      category,
      is_fluid: !!is_fluid
    })

    return NextResponse.json({ 
      success: true, 
      collection_id: collectionId 
    })

  } catch (error) {
    console.error('Erro ao criar coleção:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}