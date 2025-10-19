import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase com Service Role Key (só funciona no servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, workspaceId, role } = await request.json()

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'Email e workspaceId são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔧 API Associate User: Associando usuário:', email, 'ao workspace:', workspaceId)

    // Buscar o usuário pelo email
    const { data: usersList, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const user = usersList.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', user.id, user.email)

    // Verificar se já está associado
    const { data: existingMember, error: existingError } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      console.error('❌ Erro ao verificar associação existente:', existingError)
      return NextResponse.json(
        { error: 'Erro ao verificar associação existente' },
        { status: 500 }
      )
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'Usuário já está associado a este workspace' },
        { status: 409 }
      )
    }

    // Associar usuário ao workspace
    const { data: newMember, error: associateError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: role || 'member',
        joined_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (associateError) {
      console.error('❌ Erro ao associar usuário:', associateError)
      return NextResponse.json(
        { error: `Erro ao associar usuário: ${associateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Usuário associado com sucesso:', newMember.id)

    return NextResponse.json({
      success: true,
      message: 'Usuário associado ao workspace com sucesso',
      member: newMember
    })

  } catch (error: any) {
    console.error('❌ Erro na API associate-user:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    )
  }
}
