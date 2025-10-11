'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearInvalidTokens } from '@/lib/supabase/client'

/**
 * Componente para capturar e tratar erros de autenticação globalmente
 * Especialmente o erro: "Invalid Refresh Token: Refresh Token Not Found"
 */
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Capturar erros de promessas não tratadas
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Verificar se é erro de refresh token
      if (
        error?.message?.includes('Invalid Refresh Token') ||
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('refresh_token_not_found')
      ) {
        console.error('🚨 AuthErrorBoundary: Detected invalid refresh token error')
        
        // Prevenir erro de aparecer no console
        event.preventDefault()
        
        try {
          // Limpar tokens inválidos
          await clearInvalidTokens()
          
          // Limpar tudo relacionado ao Supabase
          if (typeof window !== 'undefined') {
            // Limpar localStorage
            const keysToRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (key.includes('supabase') || key.includes('sb-'))) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
            
            // Limpar cookies do Supabase
            document.cookie.split(';').forEach(c => {
              const cookie = c.trim()
              if (cookie.includes('sb-') || cookie.includes('supabase')) {
                const name = cookie.split('=')[0]
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
              }
            })
            
            console.log('✅ AuthErrorBoundary: Cleared invalid tokens and redirecting to login')
          }
          
          // Redirecionar para login após pequeno delay
          setTimeout(() => {
            router.push('/auth/login?error=session_expired')
          }, 500)
        } catch (err) {
          console.error('❌ AuthErrorBoundary: Error clearing tokens:', err)
        }
      }
    }

    // Capturar erros do console
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ')
      
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found')
      ) {
        console.log('🚨 AuthErrorBoundary: Intercepted refresh token error from console')
        handleUnhandledRejection({
          reason: { message: errorMessage },
          preventDefault: () => {},
        } as any)
        return
      }
      
      originalConsoleError.apply(console, args)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
    }
  }, [router])

  return <>{children}</>
}

