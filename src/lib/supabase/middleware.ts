import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Supabase environment variables not found, skipping auth check')
      return supabaseResponse
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // ✅ DESENVOLVIMENTO: Verificar se há usuário mock ativo (via cookie)
    const mockUserEnabled = request.cookies.get('dev_mock_user')?.value === 'true'
    
    if (mockUserEnabled) {
      console.log('Middleware: Mock user enabled, skipping auth check')
      return supabaseResponse
    }

    // Verificar autenticação com timeout
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )

    const {
      data: { user },
    } = await Promise.race([authPromise, timeoutPromise]) as any

    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/api')
    ) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Supabase middleware error:', error)
    // Em caso de erro, permitir acesso direto
    return NextResponse.next({ request })
  }
}
