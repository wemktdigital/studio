import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetCode } from '@/lib/services/password-reset-service'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/send-reset-code
 * Envia código de recuperação de senha por email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a tabela existe antes de tentar usar
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Tentar acessar a tabela para verificar se existe
      const { error: tableCheckError } = await supabaseAdmin
        .from('password_reset_codes')
        .select('count')
        .limit(1)

      if (tableCheckError && tableCheckError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Tabela não encontrada no banco de dados',
          details: 'A tabela password_reset_codes precisa ser criada no Supabase',
          solution: {
            step1: 'Acesse: https://supabase.com/dashboard',
            step2: 'Selecione seu projeto',
            step3: 'Clique em "SQL Editor"',
            step4: 'Cole e execute o conteúdo do arquivo FIX_PASSWORD_RESET_CODES.sql',
            file: 'FIX_PASSWORD_RESET_CODES.sql na raiz do projeto'
          }
        }, { status: 503 })
      }
    } catch (checkError) {
      // Se houver erro ao verificar, continua tentando enviar o código
      console.warn('Não foi possível verificar tabela:', checkError)
    }

    const result = await sendPasswordResetCode(email)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // Por segurança, sempre retornamos sucesso mesmo se email não existir
    return NextResponse.json({ 
      success: true, 
      message: 'Código enviado para seu email' 
    })
  } catch (error: any) {
    console.error('Erro na API send-reset-code:', error)
    
    // Se o erro for relacionado à tabela não encontrada, retornar mensagem clara
    if (error?.code === 'PGRST205' || error?.message?.includes('password_reset_codes')) {
      return NextResponse.json({
        success: false,
        error: 'Tabela não encontrada no banco de dados',
        details: 'Execute o arquivo FIX_PASSWORD_RESET_CODES.sql no Supabase SQL Editor',
        instruction: 'Acesse: https://supabase.com/dashboard > Seu Projeto > SQL Editor > Execute o SQL'
      }, { status: 503 })
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

