import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role = 'member', expiresInDays = 7 } = await request.json()

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

    // Verificar se o usuário tem permissão para criar links de convite
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Permitir criação de links se o usuário for owner, admin, ou se não for membro (para convites externos)
    if (membership && !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Apenas owners e admins podem criar links de convite' },
        { status: 403 }
      )
    }

    // Se não for membro, permitir criação de link (para casos de convites externos)
    console.log('✅ Usuário autorizado a criar links de convite para o workspace:', workspaceId)

    // Buscar informações do workspace
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

    // Buscar informações do usuário convidador
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

    // Gerar token único para o link de convite
    const inviteToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    // Criar registro de convite compartilhável
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .insert({
        email: 'shared_link', // Email especial para links compartilháveis
        workspace_id: workspaceId,
        inviter_id: user.id,
        token: inviteToken,
        role: role,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        message: `Convite compartilhável para o workspace ${workspace.name}`
      })
      .select('*')
      .single()

    if (inviteError) {
      console.error('❌ Erro ao criar link de convite:', inviteError)
      return NextResponse.json(
        { error: 'Erro ao criar link de convite' },
        { status: 500 }
      )
    }

    // Gerar URL do convite
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`

    console.log('✅ Link de convite criado:', {
      workspaceId,
      workspaceName: workspace.name,
      inviterName: inviter.display_name,
      inviteToken,
      expiresAt: expiresAt.toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        inviteUrl,
        inviteToken,
        expiresAt: expiresAt.toISOString(),
        workspaceName: workspace.name,
        inviterName: inviter.display_name,
        role
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API de link de convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inviteToken = searchParams.get('token')

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Token do convite é obrigatório' },
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

    // Buscar o convite
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('workspace_id, inviter_id')
      .eq('token', inviteToken)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão para cancelar este convite
    if (invite.inviter_id !== user.id) {
      // Verificar se é admin/owner do workspace
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Você não tem permissão para cancelar este convite' },
          { status: 403 }
        )
      }
    }

    // Cancelar o convite
    const { error: cancelError } = await supabase
      .from('workspace_invites')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('token', inviteToken)

    if (cancelError) {
      console.error('❌ Erro ao cancelar convite:', cancelError)
      return NextResponse.json(
        { error: 'Erro ao cancelar convite' },
        { status: 500 }
      )
    }

    console.log('✅ Convite cancelado:', { inviteToken })

    return NextResponse.json({
      success: true,
      message: 'Convite cancelado com sucesso'
    })

  } catch (error: any) {
    console.error('❌ Erro ao cancelar convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
