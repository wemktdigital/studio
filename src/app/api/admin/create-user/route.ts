import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase com Service Role Key (só funciona no servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, display_name, user_level } = body

    // Validar dados
    if (!email || !password || !display_name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔧 API Route: Criando usuário via Admin API')

    // Verificar se o usuário já existe em auth.users
    const { data: usersList, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const existingUser = usersList.users.find(user => user.email === email)
    
    let authData: any
    
    if (existingUser && !getUserError) {
      // Usuário já existe em auth.users
      console.log('⚠️ Usuário já existe em auth.users, verificando se está em public.users...')
      
      // Verificar se está em public.users
      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', existingUser.id)
        .maybeSingle()

      if (publicUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Usuário já existe no sistema',
          code: 'USER_EXISTS',
          existingUser: publicUser
        }, { status: 409 })
      }

      // Usuário existe em auth.users mas não em public.users
      // Criar registro em public.users
      console.log('🔄 Usuário existe em auth.users, criando registro em public.users...')
      
      const { data: newPublicUser, error: createPublicError } = await supabaseAdmin
        .from('users')
        .insert({
          id: existingUser.id,
          username: display_name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
          display_name,
          avatar_url: null,
          status: 'online',
          user_level: user_level || 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (createPublicError) {
        console.error('❌ Erro ao criar registro em public.users:', createPublicError)
        return NextResponse.json({ success: false, error: 'Erro ao criar registro do usuário' }, { status: 500 })
      }

      console.log('✅ Registro criado em public.users para usuário existente:', newPublicUser.id)
      
      return NextResponse.json({ 
        success: true, 
        user: newPublicUser,
        message: 'Usuário existente foi adicionado ao sistema'
      })

    } else {
      // Usuário não existe, criar novo
      console.log('🆕 Criando novo usuário...')
      
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          display_name,
          user_level: user_level || 'member'
        }
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário via Admin API:', authError)
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${authError.message}` },
          { status: 400 }
        )
      }

      if (!newAuthData.user) {
        return NextResponse.json(
          { error: 'Falha ao criar usuário - dados não retornados' },
          { status: 500 }
        )
      }

      authData = newAuthData
      console.log('✅ Novo usuário criado via Admin API:', authData.user.id)
    }

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verificar se o usuário foi criado na tabela users (via trigger)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (userError) {
      console.error('❌ Erro ao buscar usuário na tabela users:', userError)
      return NextResponse.json(
        { error: `Usuário criado no sistema de autenticação, mas erro ao verificar na tabela users: ${userError.message}` },
        { status: 500 }
      )
    }

    if (!userData) {
      console.error('❌ Usuário não encontrado na tabela users após criação')
      return NextResponse.json(
        { 
          error: `Usuário criado no sistema de autenticação (${authData.user.email}), mas não foi inserido na tabela 'users'. O trigger 'handle_new_user' pode não estar funcionando corretamente.`,
          user_id: authData.user.id,
          email: authData.user.email
        },
        { status: 500 }
      )
    }

    console.log('✅ Usuário encontrado na tabela users:', userData.display_name)

    // Retornar dados do usuário criado
    return NextResponse.json({
      success: true,
      user: {
        ...userData,
        workspaces: [] // Usuário novo não tem workspaces ainda
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API route create-user:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    )
  }
}
