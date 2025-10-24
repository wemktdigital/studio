'use client'

import { createClient, clearInvalidTokens } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const hasRedirected = useRef(false)
  
  // ✅ SSR SAFE: Create Supabase client only on client side
  const supabase = typeof window !== 'undefined' ? createClient() : null
  
  // ✅ DESENVOLVIMENTO: Modo mock para testar sem autenticação real
  const DEV_MODE = process.env.NODE_ENV === 'development'
  const MOCK_USER_ENABLED = DEV_MODE && typeof window !== 'undefined' && localStorage.getItem('dev_mock_user') === 'true'

  useEffect(() => {
    // ✅ SSR GUARD: Don't run auth logic on server side
    if (!supabase) {
      setLoading(false)
      return
    }
    
    // ✅ DESENVOLVIMENTO: Se modo mock está ativado, usar usuário mock
    if (MOCK_USER_ENABLED) {
      console.log('useAuth: Using mock user for development')
      
      // ✅ MIDDLEWARE: Definir cookie para o middleware reconhecer o usuário mock
      document.cookie = 'dev_mock_user=true; path=/; max-age=86400' // 24 horas
      
      const mockUser: User = {
        id: 'e4c9d0f8-b54c-4f17-9487-92872db095ab',
        email: 'dev@studio.com',
        user_metadata: {
          display_name: 'Dev User',
          handle: 'devuser',
          avatar_url: ''
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        factors: [],
        identities: []
      }
      
      const mockSession: Session = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      }
      
      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      
      // Redirect to workspace if not already there
      if (!hasRedirected.current && !window.location.pathname.startsWith('/w')) {
        console.log('Mock user authenticated, redirecting to /w')
        hasRedirected.current = true
        router.push('/w')
      }
      return
    }
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (error) {
          console.error('useAuth: Error getting initial session:', error)
          // Se há erro de token inválido, limpar o storage
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('useAuth: Invalid refresh token detected, clearing auth storage')
            await clearInvalidTokens()
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setLoading(false)
            return
          }
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Only redirect if user is signed in, we haven't redirected yet, and we're not already on a workspace page
        if (session?.user && !hasRedirected.current && !window.location.pathname.startsWith('/w')) {
          console.log('Initial session found, redirecting to /w')
          hasRedirected.current = true
          router.push('/w')
        }
      } catch (err) {
        console.error('useAuth: Exception getting initial session:', err)
        setSession(null)
        setUser(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes with timeout protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        // Tratar erros de token inválido
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('useAuth: Token refresh failed, clearing session')
          await clearInvalidTokens()
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        
        // Tratar erro específico de refresh token
        if (event === 'TOKEN_REFRESHED' && session === null) {
          console.log('useAuth: Invalid refresh token, clearing auth data')
          await clearInvalidTokens()
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setLoading(false)
          router.push('/auth/login')
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle redirects based on auth state
        if (event === 'SIGNED_IN' && session?.user && !hasRedirected.current && !window.location.pathname.startsWith('/w')) {
          console.log('User signed in, redirecting to /w')
          hasRedirected.current = true
          router.push('/w')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to /')
          hasRedirected.current = false
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const signIn = async (email: string, password: string) => {
    console.log('useAuth.signIn: Called with email:', email)
    if (!supabase) {
      console.error('useAuth.signIn: Supabase client not available')
      return { error: { message: 'Client not available' } }
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('useAuth.signIn: Supabase response:', { data, error })
      
      // Se há erro de token inválido, limpar o storage
      if (error && (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found'))) {
        console.log('useAuth.signIn: Invalid refresh token detected, clearing auth storage')
        await clearInvalidTokens()
        await supabase.auth.signOut()
      }
      
      return { error }
    } catch (err) {
      console.error('useAuth.signIn: Exception:', err)
      return { error: err as any }
    }
  }

    const signUp = async (email: string, password: string, metadata?: { display_name?: string; handle?: string }) => {
    console.log('useAuth.signUp: Called with email:', email, 'metadata:', metadata)
    if (!supabase) {
      console.error('useAuth.signUp: Supabase client not available')
      return { error: { message: 'Client not available' } }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      console.log('useAuth.signUp: Supabase response:', { data, error })

      if (error) {
        console.error('useAuth.signUp: Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        return { error }
      }

      // O trigger handle_new_user() irá automaticamente criar o registro na tabela users
      console.log('useAuth.signUp: User created successfully, trigger will handle users table')

      // Store email for confirmation page
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup_email', email)
      }

      return { error: null }
    } catch (err) {
      console.error('useAuth.signUp: Exception:', err)
      return { error: err as any }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.error('useAuth.signOut: Supabase client not available')
      return { error: { message: 'Client not available' } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      console.error('useAuth.resetPassword: Supabase client not available')
      return { error: { message: 'Client not available' } }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  // ✅ DESENVOLVIMENTO: Funções para controlar modo mock
  const enableMockUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_mock_user', 'true')
      window.location.reload()
    }
  }
  
  const disableMockUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev_mock_user')
      window.location.reload()
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    // ✅ DESENVOLVIMENTO: Expor funções de controle do modo mock
    enableMockUser: DEV_MODE ? enableMockUser : undefined,
    disableMockUser: DEV_MODE ? disableMockUser : undefined,
    isMockUserEnabled: MOCK_USER_ENABLED,
  }
}
