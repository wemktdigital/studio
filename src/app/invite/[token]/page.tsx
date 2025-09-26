'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface InviteData {
  workspaceName: string
  inviterName: string
  memberName: string
  memberEmail: string
  role: string
  isValid: boolean
  isExpired: boolean
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Simular carregamento dos dados do convite
  useEffect(() => {
    const loadInviteData = async () => {
      setIsLoading(true)
      try {
        // Simular verificação do token
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Em produção, isso viria de uma API
        const mockInviteData: InviteData = {
          workspaceName: 'WE Marketing',
          inviterName: 'Dev User',
          memberName: 'João Silva',
          memberEmail: 'joao@exemplo.com',
          role: 'member',
          isValid: true,
          isExpired: false
        }
        
        setInviteData(mockInviteData)
      } catch (error) {
        setInviteData({
          workspaceName: '',
          inviterName: '',
          memberName: '',
          memberEmail: '',
          role: '',
          isValid: false,
          isExpired: true
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadInviteData()
    }
  }, [token])

  const handleAcceptInvite = async () => {
    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    setIsAccepting(true)
    try {
      // Simular aceitação do convite
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Convite aceito!",
        description: "Sua conta foi criada com sucesso. Redirecionando...",
      })
      
      // Redirecionar para login
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o convite. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    )
  }

  if (!inviteData || !inviteData.isValid || inviteData.isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Convite Inválido</CardTitle>
            <CardDescription>
              Este convite não é válido ou expirou. Entre em contato com quem enviou o convite.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            <strong>{inviteData.inviterName}</strong> convidou você para participar do workspace{' '}
            <strong>{inviteData.workspaceName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{inviteData.memberEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Função:</span>
              <span className="font-medium">
                {inviteData.role === 'admin' ? 'Administrador' : 'Membro'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Defina sua senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirme sua senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex-1 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Recusar
            </Button>
            <Button 
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="flex-1 gap-2"
            >
              {isAccepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Aceitar Convite
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ao aceitar, você criará uma conta e poderá acessar o workspace.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
