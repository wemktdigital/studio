import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token, email, password, displayName } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token e email são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar o convite
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select(`
        id,
        email,
        workspace_id,
        inviter_id,
        token,
        status,
        role,
        message,
        expires_at,
        created_at,
        accepted_at,
        workspaces!inner(name),
        users!workspace_invites_inviter_id_fkey(display_name)
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou inválido' },
        { status: 404 }
      )
    }

    // Verificar se o convite ainda é válido
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Convite não é mais válido' },
        { status: 400 }
      )
    }

    // Verificar se não expirou
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      // Marcar como expirado
      await supabase
        .from('workspace_invites')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invite.id)
      
      return NextResponse.json(
        { error: 'Convite expirou' },
        { status: 400 }
      )
    }

    // Verificar se o email corresponde (exceto para links compartilháveis)
    if (invite.email !== 'shared_link' && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email não corresponde ao convite' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já é membro do workspace (só se estiver logado)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    let existingMember = null
    
    if (currentUser) {
      const { data } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', currentUser.id)
        .maybeSingle()
      
      existingMember = data
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'Você já é membro deste workspace' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está logado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let userId: string

    if (authError || !user) {
      // Usuário não está logado, criar conta
      if (!password) {
        return NextResponse.json(
          { error: 'Senha é obrigatória para criar nova conta' },
          { status: 400 }
        )
      }

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            username: `user_${Date.now()}`,
            avatar_url: null,
            user_level: 'member'
          }
        }
      })

      if (signUpError || !newUser.user) {
        console.error('❌ Erro ao criar usuário:', signUpError)
        return NextResponse.json(
          { error: signUpError?.message || 'Erro ao criar conta' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
      console.log('✅ Nova conta criada:', userId)
    } else {
      // Usuário já está logado
      userId = user.id
      console.log('👤 Usuário já logado:', userId)
    }

    // Adicionar usuário ao workspace
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role,
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('❌ Erro ao adicionar usuário ao workspace:', memberError)
      return NextResponse.json(
        { error: 'Erro ao adicionar ao workspace' },
        { status: 500 }
      )
    }

    // Marcar convite como aceito
    const { error: acceptError } = await supabase
      .from('workspace_invites')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    if (acceptError) {
      console.error('❌ Erro ao marcar convite como aceito:', acceptError)
      // Não falhar aqui, pois o usuário já foi adicionado ao workspace
    }

    console.log('✅ Convite aceito com sucesso:', {
      workspaceId: invite.workspace_id,
      workspaceName: invite.workspaces.name,
      userId,
      role: invite.role
    })

    return NextResponse.json({
      success: true,
      data: {
        workspaceId: invite.workspace_id,
        workspaceName: invite.workspaces.name,
        role: invite.role,
        userId
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API de aceitar convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
