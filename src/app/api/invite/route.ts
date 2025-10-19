import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInviteService, InviteData } from '@/lib/services/invite-service'

export async function POST(request: NextRequest) {
  try {
    const { emails, workspaceId, workspaceName, message, inviterName, role } = await request.json()

    if (!emails || !workspaceId || !workspaceName) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para convidar no workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Permitir convites se o usuário for owner, admin, ou se não for membro (para convites externos)
    if (membership && !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Apenas owners e admins podem convidar pessoas' },
        { status: 403 }
      )
    }

    // Se não for membro, permitir convite (para casos de convites externos)
    console.log('✅ Usuário autorizado a enviar convites para o workspace:', workspaceId)

    // Parse emails (separados por vírgula)
    const emailList = emails.split(',').map((email: string) => email.trim()).filter(Boolean)
    
    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum email válido fornecido' },
        { status: 400 }
      )
    }

    // Validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Emails inválidos: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Preparar dados dos convites
    const inviteData: InviteData[] = emailList.map(email => ({
      email,
      workspaceId,
      workspaceName,
      inviterId: user.id,
      inviterName: inviterName || user.user_metadata?.display_name || user.email || 'Usuário',
      role: (role as 'owner' | 'admin' | 'member') || 'member',
      message: message || null
    }))

    // Usar o serviço de convites
    const inviteService = getInviteService()
    const result = await inviteService.createInvites(inviteData)

    if (!result.success) {
      console.error('Error creating invites:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao criar convites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Convites enviados para ${result.data?.emailStats.totalSent || 0} email(s)`,
      data: result.data
    })

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET endpoint para listar convites de um workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para ver convites do workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Usuário não é membro deste workspace' },
        { status: 403 }
      )
    }

    // Buscar convites do workspace
    const inviteService = getInviteService()
    const result = await inviteService.getWorkspaceInvites(workspaceId)

    if (!result.success) {
      console.error('Error fetching invites:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao buscar convites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in invite GET API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE endpoint para cancelar um convite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json(
        { error: 'inviteId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para cancelar este convite
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('workspace_id, inviter_id')
      .eq('id', inviteId)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    if (invite.inviter_id !== user.id) {
      return NextResponse.json(
        { error: 'Você só pode cancelar seus próprios convites' },
        { status: 403 }
      )
    }

    // Cancelar o convite
    const inviteService = getInviteService()
    const result = await inviteService.cancelInvite(inviteId)

    if (!result.success) {
      console.error('Error cancelling invite:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao cancelar convite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Convite cancelado com sucesso'
    })

  } catch (error) {
    console.error('Error in invite DELETE API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
