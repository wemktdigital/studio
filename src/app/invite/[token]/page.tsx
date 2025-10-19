'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { getInviteService } from '@/lib/services/invite-service'
import type { InviteStatus } from '@/lib/services/invite-service'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Verificar se o usuário está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setIsUserLoggedIn(true)
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            displayName: user.user_metadata?.display_name || ''
          }))
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      }
    }

    checkAuth()
  }, [])

  // Carregar dados do convite
  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Token de convite inválido')
        setIsLoading(false)
        return
      }

      try {
        const inviteService = getInviteService()
        const result = await inviteService.getInviteByToken(token)

        if (!result.success || !result.data) {
          setError(result.error || 'Convite não encontrado ou expirado')
          setIsLoading(false)
          return
        }

        setInvite(result.data)
        
        // Preencher email se não estiver logado
        if (!isUserLoggedIn && result.data.email !== 'shared_link') {
          setFormData(prev => ({
            ...prev,
            email: result.data!.email,
            displayName: result.data!.email.split('@')[0]
          }))
        }
      } catch (error: any) {
        console.error('Erro ao carregar convite:', error)
        setError('Erro ao carregar convite')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [token, isUserLoggedIn])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive"
      })
      return false
    }

    if (!isUserLoggedIn) {
      if (!formData.password) {
        toast({
          title: "Erro",
          description: "Senha é obrigatória",
          variant: "destructive"
        })
        return false
      }

      if (formData.password.length < 6) {
        toast({
          title: "Erro",
          description: "Senha deve ter pelo menos 6 caracteres",
          variant: "destructive"
        })
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "Senhas não coincidem",
          variant: "destructive"
        })
        return false
      }
    }

    if (!formData.displayName) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleAcceptInvite = async () => {
    if (!validateForm() || !invite) return

    setIsAccepting(true)
    try {
      // Usar a API route para aceitar convite
      const response = await fetch('/api/workspace/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          email: formData.email,
          password: isUserLoggedIn ? undefined : formData.password,
          displayName: formData.displayName
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aceitar convite')
      }

      toast({
        title: "Convite aceito!",
        description: `Bem-vindo ao workspace ${result.data?.workspaceName}!`,
      })

      // Redirecionar para o workspace
      router.push(`/w/${result.data?.workspaceId}`)

    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error)
      toast({
        title: "Erro",
        description: error.message || 'Não foi possível aceitar o convite',
        variant: "destructive"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Carregando convite...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <span>Convite Inválido</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Este convite não é válido ou expirou.'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            {invite.inviterName} convidou você para participar do workspace{' '}
            <strong>{invite.workspaceName}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {invite.message && (
            <Alert>
              <AlertDescription>
                <strong>Mensagem do convidador:</strong><br />
                "{invite.message}"
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={invite.email !== 'shared_link' && !isUserLoggedIn}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="displayName">Nome completo</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            {!isUserLoggedIn && (
              <>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Digite a senha novamente"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUserLoggedIn ? 'Entrando no workspace...' : 'Criando conta e entrando...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isUserLoggedIn ? 'Entrar no Workspace' : 'Aceitar Convite e Criar Conta'}
                </>
              )}
            </Button>

            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              ⏰ Este convite expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}