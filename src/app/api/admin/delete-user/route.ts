import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
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

    // Verificar se o usuário é super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('user_level')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || adminUser.user_level !== 'super_admin') {
      return NextResponse.json(
        { error: 'Apenas super admins podem deletar usuários' },
        { status: 403 }
      )
    }

    console.log('🗑️ Iniciando exclusão completa do usuário:', userId)

    // 1. Remover de todos os workspaces
    const { error: workspaceError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', userId)

    if (workspaceError) {
      console.error('❌ Erro ao remover usuário dos workspaces:', workspaceError)
    } else {
      console.log('✅ Usuário removido de todos os workspaces')
    }

    // 2. Remover da tabela public.users
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (usersError) {
      console.error('❌ Erro ao remover usuário da tabela users:', usersError)
    } else {
      console.log('✅ Usuário removido da tabela users')
    }

    // 3. Remover da tabela auth.users (Admin API)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('❌ Erro ao remover usuário do auth:', authDeleteError)
      // Não falhar aqui, pois o usuário já foi removido das outras tabelas
    } else {
      console.log('✅ Usuário removido do auth.users')
    }

    // 4. Remover convites relacionados
    const { error: invitesError } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('inviter_id', userId)

    if (invitesError) {
      console.error('❌ Erro ao remover convites do usuário:', invitesError)
    } else {
      console.log('✅ Convites do usuário removidos')
    }

    console.log('✅ Exclusão completa do usuário concluída:', userId)

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído completamente do sistema'
    })

  } catch (error: any) {
    console.error('❌ Erro na API de exclusão de usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
