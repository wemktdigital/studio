'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailFromParams = searchParams.get('email')
    const emailFromStorage = localStorage.getItem('signup_email')
    
    if (emailFromParams) {
      setEmail(emailFromParams)
      localStorage.setItem('signup_email', emailFromParams)
    } else if (emailFromStorage) {
      setEmail(emailFromStorage)
    }
  }, [searchParams])

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResending(true)
    try {
      // Use Supabase auth to resend confirmation email
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Error resending email:', error)
        // You could show an error toast here
      } else {
        console.log('Email resent successfully')
        // You could show a success toast here
      }
    } catch (error) {
      console.error('Error resending email:', error)
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/auth/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Cadastro Realizado!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Verifique seu email para ativar sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Enviamos um link de confirmação para:
            </p>
            <p className="font-medium text-gray-900 break-all">
              {email || 'seu email'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifique sua caixa de entrada</li>
              <li>• Clique no link de confirmação</li>
              <li>• Faça login com suas credenciais</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline" 
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar email
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleGoToLogin}
              className="w-full"
            >
              Ir para o Login
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="ghost" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Não recebeu o email? Verifique sua pasta de spam</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}
