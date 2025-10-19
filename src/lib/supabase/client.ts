import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient> | null = null

// ✅ FUNÇÃO: Limpar tokens inválidos
export async function clearInvalidTokens() {
  if (typeof window !== 'undefined') {
    try {
      // Limpar tokens do localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('supabase') && key.includes('auth')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('createClient: Removed invalid token key:', key)
      })
      
      console.log('createClient: Cleared invalid tokens from localStorage')
    } catch (error) {
      console.error('createClient: Error clearing tokens:', error)
    }
  }
}

// ✅ FUNÇÃO: Verificar se mock user está ativo
export function isMockUserEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  const DEV_MODE = process.env.NODE_ENV === 'development'
  const MOCK_USER_ENABLED = DEV_MODE && localStorage.getItem('dev_mock_user') === 'true'
  
  return MOCK_USER_ENABLED
}

// ✅ FUNÇÃO: Criar cliente Supabase com tratamento de SSR
export function createClient(useServiceRole: boolean = false) {
  // ✅ SSR CHECK: Criar cliente mesmo no servidor para build
  if (typeof window === 'undefined') {
    console.log('createClient: SSR detected, creating server client')
    const key = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key
    )
  }
  
  console.log('createClient: Called (client-side)')
  console.log('createClient: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('createClient: NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('createClient: Mock user enabled:', isMockUserEnabled())
  
  // Para Service Role, sempre criar um novo cliente
  if (useServiceRole) {
    console.log('createClient: Creating Service Role client')
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key
    )
  }

  if (!supabase) {
    try {
      console.log('createClient: Creating new Supabase client')
      
      supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      console.log('createClient: Supabase client created successfully')
    } catch (error) {
      console.error('createClient: Error creating Supabase client:', error)
      throw error
    }
  } else {
    console.log('createClient: Returning existing Supabase client')
  }
  
  return supabase
}
