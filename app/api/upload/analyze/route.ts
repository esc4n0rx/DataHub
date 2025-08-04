import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { UploadAnalyzer } from '@/lib/upload-analyzer'
import { UploadAPI } from '@/lib/upload-api'

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

    // Processar form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const datasetName = formData.get('datasetName') as string
    const description = formData.get('description') as string

    if (!file || !datasetName) {
      return NextResponse.json(
        { error: 'Arquivo e nome do dataset são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      )
    }

    // Validar tamanho (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 100MB)' },
        { status: 400 }
      )
    }

    // Criar dataset
    const datasetId = await UploadAPI.createDataset(
      datasetName,
      file.name,
      file.size,
      0, // será atualizado após análise
      0, // será atualizado após análise
      description
    )

    await UploadAPI.log(datasetId, 'info', 'Iniciando análise do arquivo')

    try {
      // Analisar arquivo
      const fileAnalysis = await UploadAnalyzer.analyzeFile(file)
      await UploadAPI.log(datasetId, 'info', `Arquivo analisado: ${fileAnalysis.totalRows} registros, ${fileAnalysis.headers.length} colunas`)

      // Analisar colunas
      const columnAnalysis = UploadAnalyzer.analyzeColumns(
        fileAnalysis.headers,
        fileAnalysis.data
      )

      // Verificar integridade
      const issues = UploadAnalyzer.validateDataIntegrity(columnAnalysis, fileAnalysis.data)
      
      if (issues.length > 0) {
        for (const issue of issues) {
          await UploadAPI.log(datasetId, 'warning', issue)
        }
      }

      // Atualizar totais no dataset
      await UploadAPI.updateDatasetStatus(datasetId, 'analyzing')

      // Verificar se precisa de ajuste
      const needsAdjustment = columnAnalysis.some(col => 
        col.confidence < 0.8 || col.issues.length > 0
      )

      const result = {
        dataset_id: datasetId,
        columns: columnAnalysis,
        sample_rows: fileAnalysis.data.slice(0, 5),
        needs_adjustment: needsAdjustment,
        total_rows: fileAnalysis.totalRows,
        total_columns: fileAnalysis.headers.length
      }

      if (needsAdjustment) {
        await UploadAPI.updateDatasetStatus(datasetId, 'pending_adjustment')
        await UploadAPI.log(datasetId, 'info', 'Análise concluída - requer ajustes de tipos')
      } else {
        await UploadAPI.log(datasetId, 'info', 'Análise concluída - tipos detectados automaticamente')
      }

      return NextResponse.json({ success: true, result })

    } catch (analysisError) {
      await UploadAPI.log(datasetId, 'error', `Erro na análise: ${analysisError}`)
      await UploadAPI.updateDatasetStatus(datasetId, 'error')
      throw analysisError
    }

  } catch (error) {
    console.error('Erro na API de análise:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}