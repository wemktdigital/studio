import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/auth/check-table
 * Verifica se a tabela password_reset_codes existe
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se a tabela existe
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('count')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          exists: false,
          error: 'Tabela não encontrada',
          message: 'A tabela password_reset_codes não existe no banco de dados',
          solution: {
            step1: 'Acesse https://supabase.com/dashboard',
            step2: 'Selecione seu projeto',
            step3: 'Vá em SQL Editor',
            step4: 'Execute o arquivo FIX_PASSWORD_RESET_CODES.sql',
            sqlFile: 'FIX_PASSWORD_RESET_CODES.sql',
            instruction: 'Crie a tabela executando o SQL no Supabase Dashboard'
          }
        }, { status: 404 })
      }
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      exists: true,
      message: 'Tabela encontrada! ✅'
    })
  } catch (error: any) {
    return NextResponse.json({
      exists: false,
      error: error.message || 'Erro ao verificar tabela'
    }, { status: 500 })
  }
}

