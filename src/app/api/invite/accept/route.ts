import { NextRequest, NextResponse } from 'next/server'
import { getInviteService } from '@/lib/services/invite-service'

export async function POST(request: NextRequest) {
  try {
    const { token, userData } = await request.json()

    if (!token || !userData) {
      return NextResponse.json(
        { error: 'Token e dados do usuário são obrigatórios' },
        { status: 400 }
      )
    }

    const { email, password, displayName, handle } = userData

    if (!email || !password || !displayName || !handle) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validações básicas
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (displayName.length < 2) {
      return NextResponse.json(
        { error: 'O nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (handle.length < 3) {
      return NextResponse.json(
        { error: 'O handle deve ter pelo menos 3 caracteres' },
        { status: 400 }
      )
    }

    // Usar o serviço de convites para aceitar
    const inviteService = getInviteService()
    const result = await inviteService.acceptInvite(token, {
      email,
      password,
      displayName,
      handle
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao aceitar convite' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Convite aceito com sucesso!',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
