'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { getMagicLinkService } from '@/lib/services/magic-link-service'
import { Suspense } from 'react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your sign in...')

  const magicLinkService = getMagicLinkService()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔮 Processing magic link callback...')

        // Verificar se há erro nos parâmetros
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          console.error('❌ Auth error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed')
          return
        }

        // Aguardar um momento para o Supabase processar o token
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verificar se usuário está autenticado
        const user = await magicLinkService.getCurrentUser()

        if (user) {
          console.log('✅ User authenticated:', user.email)
          setStatus('success')
          setMessage('Sign in successful! Redirecting...')

          // Redirecionar para dashboard após 1 segundo
          setTimeout(() => {
            router.push('/w')
          }, 1000)
        } else {
          console.error('❌ No user found after callback')
          setStatus('error')
          setMessage('Authentication failed. Please try again.')

          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push('/auth/magic-link')
          }, 3000)
        }
      } catch (error) {
        console.error('❌ Error in callback:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/auth/magic-link')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h1 
              className="text-2xl font-semibold text-slate-900"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              {status === 'loading' && 'Signing you in...'}
              {status === 'success' && 'Welcome back!'}
              {status === 'error' && 'Oops!'}
            </h1>
            <p 
              className={`text-base ${
                status === 'error' ? 'text-red-600' : 'text-slate-600'
              }`}
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              {message}
            </p>
          </div>

          {/* Loading Progress */}
          {status === 'loading' && (
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}

          {/* Retry Button (only for errors) */}
          {status === 'error' && (
            <button
              onClick={() => router.push('/auth/magic-link')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.06em'
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}

