import { NextRequest, NextResponse } from 'next/server'
import { validateResetCode } from '@/lib/services/password-reset-service'

/**
 * POST /api/auth/validate-reset-code
 * Valida código de recuperação de senha
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { valid: false, error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await validateResetCode(email, code)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erro ao validar código:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar código' },
      { status: 500 }
    )
  }
}

