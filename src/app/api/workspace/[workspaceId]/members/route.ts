import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID é obrigatório' },
        { status: 400 }
      )
    }

    // Usar Service Role Key para acessar dados sem autenticação do usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 API Workspace Members: Buscando membros para workspace:', workspaceId)

    // Buscar membros do workspace (versão simplificada)
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('id, user_id, role, joined_at')
      .eq('workspace_id', workspaceId)

    if (membersError) {
      console.error('❌ Erro ao buscar membros do workspace:', membersError)
      return NextResponse.json(
        { error: 'Erro ao buscar membros do workspace' },
        { status: 500 }
      )
    }

    console.log('✅ API Workspace Members: Encontrados', members?.length || 0, 'membros')

    // Buscar dados dos usuários separadamente
    const userIds = members?.map(member => member.user_id) || []
    let usersData = []

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url, status, user_level')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Erro ao buscar dados dos usuários:', usersError)
        return NextResponse.json(
          { error: 'Erro ao buscar dados dos usuários' },
          { status: 500 }
        )
      }

      usersData = users || []
    }

    // Transformar dados para o formato esperado pelo frontend
    const formattedMembers = members?.map(member => {
      const user = usersData.find(u => u.id === member.user_id) || {
        id: member.user_id,
        display_name: 'Usuário sem nome',
        username: `user_${member.user_id.slice(0, 8)}`,
        avatar_url: null,
        status: 'offline',
        user_level: 'member'
      }

      return {
        id: user.id,
        displayName: user.display_name || 'Usuário sem nome',
        handle: user.username || `user_${user.id.slice(0, 8)}`,
        email: '', // Email não está disponível na tabela users
        avatarUrl: user.avatar_url,
        status: user.status || 'offline',
        userLevel: user.user_level || 'member',
        role: member.role,
        joinedAt: member.joined_at,
        isOnline: user.status === 'online'
      }
    }) || []

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      count: formattedMembers.length
    })

  } catch (error: any) {
    console.error('❌ Erro na API workspace members:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    )
  }
}
