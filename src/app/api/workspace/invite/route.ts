import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/services/email-service'
import { getInviteService, InviteData } from '@/lib/services/invite-service'

export async function POST(request: NextRequest) {
  try {
    const { email, workspaceId, role = 'member', message } = await request.json()

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'Email e workspaceId são obrigatórios' },
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

    // Buscar informações do workspace e do usuário convidador
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    const { data: inviter, error: inviterError } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (inviterError || !inviter) {
      return NextResponse.json(
        { error: 'Usuário convidador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe um convite pendente para este email
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('workspace_invites')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInviteError) {
      console.error('❌ Erro ao verificar convite existente:', existingInviteError)
      return NextResponse.json(
        { error: 'Erro ao verificar convites existentes' },
        { status: 500 }
      )
    }

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Já existe um convite pendente para este email neste workspace' },
        { status: 409 }
      )
    }

    // Verificar se o usuário já é membro do workspace (comentado porque estamos convidando alguém)
    // const { data: existingMember, error: existingMemberError } = await supabase
    //   .from('workspace_members')
    //   .select('user_id')
    //   .eq('workspace_id', workspaceId)
    //   .eq('user_id', user.id)
    //   .maybeSingle()

    // Buscar se existe usuário com este email
    const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserByEmail(email)

    if (existingUserError && existingUserError.message !== 'User not found') {
      console.error('❌ Erro ao verificar usuário existente:', existingUserError)
    }

    // Se o usuário já existe e já é membro, retornar erro
    if (existingUser?.user) {
      const { data: userMembership, error: userMembershipError } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingUser.user.id)
        .maybeSingle()

      if (userMembershipError) {
        console.error('❌ Erro ao verificar membership do usuário:', userMembershipError)
      }

      if (userMembership) {
        return NextResponse.json(
          { error: 'Este usuário já é membro deste workspace' },
          { status: 409 }
        )
      }
    }

    // Criar convite usando o InviteService
    const inviteService = getInviteService()
    
    const inviteData: InviteData[] = [{
      email: email.toLowerCase().trim(),
      workspaceId,
      workspaceName: workspace.name,
      inviterId: user.id,
      inviterName: inviter.display_name || 'Usuário',
      role: role as 'owner' | 'admin' | 'member',
      message: message || null
    }]

    const result = await inviteService.createInvites(inviteData)

    if (!result.success) {
      console.error('❌ Erro ao criar convite:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao criar convite' },
        { status: 500 }
      )
    }

    console.log('✅ Convite criado com sucesso:', {
      email,
      workspaceId,
      workspaceName: workspace.name,
      inviterName: inviter.display_name
    })

    return NextResponse.json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        invite: result.data?.invites[0],
        emailStats: result.data?.emailStats
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API de convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Apenas owners e admins podem ver convites' },
        { status: 403 }
      )
    }

    // Buscar convites do workspace
    const inviteService = getInviteService()
    const result = await inviteService.getWorkspaceInvites(workspaceId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao buscar convites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar convites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
