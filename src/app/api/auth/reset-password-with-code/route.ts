import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordWithCode } from '@/lib/services/password-reset-service'

/**
 * POST /api/auth/reset-password-with-code
 * Redefine senha usando código validado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, código e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const result = await resetPasswordWithCode(email, code, newPassword)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Senha redefinida com sucesso' 
    })
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao redefinir senha' },
      { status: 500 }
    )
  }
}

