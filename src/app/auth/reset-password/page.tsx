'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2, Key } from 'lucide-react'

type Step = 'email' | 'code' | 'password'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Etapa 1: Solicitar email e enviar código
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (!data.success) {
        // Se for erro de tabela não encontrada, mostrar mensagem mais clara
        if (data.error?.includes('Tabela não encontrada') || data.details?.includes('password_reset_codes') || data.error?.code === 'PGRST205') {
          toast({
            title: "🚨 AÇÃO NECESSÁRIA: Criar Tabela no Supabase",
            description: (
              <div className="space-y-2">
                <p className="font-semibold">A tabela password_reset_codes precisa ser criada:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Acesse: <strong>https://supabase.com/dashboard</strong></li>
                  <li>Seu Projeto → <strong>SQL Editor</strong></li>
                  <li>Abra o arquivo: <strong>SOLUCAO_SIMPLES.sql</strong></li>
                  <li>Copie TODO o conteúdo e cole no SQL Editor</li>
                  <li>Clique em <strong>"Run"</strong></li>
                  <li>Recarregue esta página e tente novamente</li>
                </ol>
              </div>
            ),
            variant: "destructive",
            duration: 15000,
          })
        } else {
          toast({
            title: "Erro",
            description: data.error || "Não foi possível enviar o código",
            variant: "destructive",
          })
        }
      } else {
        setStep('code')
        toast({
          title: "Código enviado!",
          description: "Verifique sua caixa de entrada",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Etapa 2: Validar código
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      toast({
        title: "Erro",
        description: "Digite o código de 6 dígitos recebido por email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/validate-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()
      
      if (!data.valid) {
        toast({
          title: "Código inválido",
          description: data.error || "O código está incorreto ou expirou",
          variant: "destructive",
        })
        setCode('')
      } else {
        setStep('password')
        toast({
          title: "Código válido!",
          description: "Agora defina sua nova senha",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Etapa 3: Redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      })

      const data = await response.json()
      
      if (!data.success) {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível redefinir a senha",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi alterada com sucesso. Redirecionando...",
        })

        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível redefinir a senha",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Renderizar baseado no passo atual
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </Link>
        </div>
        
        {/* ETAPA 1: Solicitar Email */}
        {step === 'email' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Recuperar senha
              </CardTitle>
              <CardDescription className="text-center">
                Digite seu email para receber um código de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar código
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  Lembrou sua senha?{' '}
                </span>
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ETAPA 2: Inserir Código */}
        {step === 'code' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Key className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Verifique seu email
              </CardTitle>
              <CardDescription className="text-center">
                Enviamos um código de 6 dígitos para {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleValidateCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de verificação</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => {
                        // Permitir apenas números e limitar a 6 dígitos
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setCode(value)
                      }}
                      className="pl-10 text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Digite o código de 6 dígitos recebido por email
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStep('email')
                    setCode('')
                  }}
                  className="text-sm"
                >
                  Usar outro email
                </Button>
                <div className="text-xs text-muted-foreground">
                  O código expira em 15 minutos
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ETAPA 3: Definir Nova Senha */}
        {step === 'password' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Definir nova senha
              </CardTitle>
              <CardDescription className="text-center">
                Código verificado! Agora defina sua nova senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
