import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { UploadAPI } from '@/lib/upload-api'
import { UploadAnalyzer } from '@/lib/upload-analyzer'
import { DataTypeAdjustment } from '@/types/upload'

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
    const { datasetId, adjustments, fileData } = body as {
      datasetId: string
      adjustments?: DataTypeAdjustment[]
      fileData: { file: string, fileName: string } // Base64 encoded
    }

    if (!datasetId || !fileData) {
      return NextResponse.json(
        { error: 'Dataset ID e dados do arquivo são obrigatórios' },
        { status: 400 }
      )
    }

    await UploadAPI.log(datasetId, 'info', 'Iniciando processamento final')

    // Verificar se o dataset existe e pertence ao usuário
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

    try {
      // Recriar arquivo a partir dos dados base64
      const fileBuffer = Buffer.from(fileData.file, 'base64')
      const file = new File([fileBuffer], fileData.fileName)

      // Aplicar ajustes se fornecidos
      if (adjustments && adjustments.length > 0) {
        await UploadAPI.updateColumns(datasetId, adjustments)
        await UploadAPI.log(datasetId, 'info', `Aplicados ajustes em ${adjustments.length} colunas`)
      }

      // Processar arquivo completo
      await UploadAPI.log(datasetId, 'info', 'Processando arquivo completo...')
      
      const fileAnalysis = await UploadAnalyzer.analyzeFile(file)
      const columnAnalysis = UploadAnalyzer.analyzeColumns(
        fileAnalysis.headers,
        fileAnalysis.data
      )

      // Salvar configurações de colunas se não existirem
      const existingColumns = await UploadAPI.getColumns(datasetId)
      if (existingColumns.length === 0) {
        await UploadAPI.saveColumns(
          datasetId,
          columnAnalysis.map((col, index) => ({
            name: col.name,
            index,
            data_type: adjustments?.find(adj => adj.column_index === index)?.data_type || col.suggested_type,
            is_required: adjustments?.find(adj => adj.column_index === index)?.is_required || false,
            sample_values: col.sample_values
          }))
        )
        await UploadAPI.log(datasetId, 'info', 'Configurações de colunas salvas')
      }

      // Processar e salvar todos os dados
      await UploadAPI.log(datasetId, 'info', `Salvando ${fileAnalysis.totalRows} registros...`)
      
      // Reprocessar arquivo completo (não apenas sample)
      const fullFileAnalysis = await UploadAnalyzer.analyzeFile(file)
      await UploadAPI.saveRows(datasetId, fullFileAnalysis.data)

      // Atualizar status final
      await UploadAPI.updateDatasetStatus(datasetId, 'confirmed')
      await UploadAPI.log(datasetId, 'info', 'Dataset processado com sucesso')

      return NextResponse.json({ 
        success: true, 
        message: 'Dataset processado com sucesso',
        datasetId 
      })

    } catch (processingError) {
      await UploadAPI.log(datasetId, 'error', `Erro no processamento: ${processingError}`)
      await UploadAPI.updateDatasetStatus(datasetId, 'error')
      throw processingError
    }

  } catch (error) {
    console.error('Erro na API de confirmação:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}