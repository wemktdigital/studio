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
    const { email, newPassword } = body

    // Validar dados
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔧 API Route: Redefinindo senha do usuário:', email)

    // Buscar o usuário
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

    // Redefinir senha usando Admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('❌ Erro ao redefinir senha:', updateError)
      return NextResponse.json(
        { error: `Erro ao redefinir senha: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Senha redefinida com sucesso para:', email)

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na API route reset-password:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    )
  }
}
