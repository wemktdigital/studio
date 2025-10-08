'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, CheckCircle, AlertCircle, Mail, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getInviteService, InviteStatus } from '@/lib/services/invite-service'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [inviteData, setInviteData] = useState<InviteStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')

  // Carregar dados do convite
  useEffect(() => {
    const loadInviteData = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const inviteService = getInviteService()
        const result = await inviteService.getInviteByToken(token)

        if (result.success && result.data) {
          setInviteData(result.data)
          // Pre-fill email and generate handle
          setDisplayName(result.data.email.split('@')[0])
          setHandle(`user_${Date.now()}`)
        } else {
          console.error('Error loading invite:', result.error)
          toast({
            title: "Convite não encontrado",
            description: result.error || "Este convite não é válido ou expirou.",
            variant: "destructive"
          })
        }
      } catch (error: any) {
        console.error('Error loading invite data:', error)
        toast({
          title: "Erro ao carregar convite",
          description: "Ocorreu um erro ao verificar o convite. Tente novamente.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInviteData()
  }, [token, toast])

  const handleAcceptInvite = async () => {
    if (!inviteData) return

    // Validações
    if (!password || !confirmPassword || !displayName || !handle) {
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

    if (displayName.length < 2) {
      toast({
        title: "Erro",
        description: "O nome deve ter pelo menos 2 caracteres.",
        variant: "destructive"
      })
      return
    }

    if (handle.length < 3) {
      toast({
        title: "Erro",
        description: "O handle deve ter pelo menos 3 caracteres.",
        variant: "destructive"
      })
      return
    }

    setIsAccepting(true)
    try {
      const inviteService = getInviteService()
      const result = await inviteService.acceptInvite(token, {
        email: inviteData.email,
        password,
        displayName,
        handle
      })

      if (result.success && result.data) {
        toast({
          title: "Convite aceito!",
          description: `Bem-vindo ao workspace ${result.data.workspaceName}!`,
        })
        
        // Redirecionar para o workspace após um delay
        setTimeout(() => {
          router.push(`/w/${result.data?.workspaceId}`)
        }, 2000)
      } else {
        throw new Error(result.error || 'Erro ao aceitar convite')
      }
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aceitar o convite. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const formatExpiryDate = (expiryDate: string) => {
    const date = new Date(expiryDate)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário'
      case 'admin': return 'Administrador'
      case 'member': return 'Membro'
      default: return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑'
      case 'admin': return '🛡️'
      case 'member': return '👤'
      default: return '👤'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verificando convite...</h3>
            <p className="text-gray-600">Por favor, aguarde enquanto validamos seu convite.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Convite Inválido</CardTitle>
            <CardDescription className="text-red-600">
              Este convite não é válido, expirou ou já foi processado. Entre em contato com quem enviou o convite.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Você foi convidado!</CardTitle>
          <CardDescription className="text-gray-600">
            <strong>{inviteData.inviterName}</strong> convidou você para participar do workspace{' '}
            <strong className="text-blue-700">{inviteData.workspaceName}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações do convite */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-800">{inviteData.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Função:</span>
              <span className="font-medium text-gray-800">
                {getRoleIcon(inviteData.role)} {getRoleDisplayName(inviteData.role)}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Expira em:</span>
              <span className="font-medium text-gray-800">{formatExpiryDate(inviteData.expiresAt)}</span>
            </div>
          </div>

          {/* Mensagem personalizada */}
          {inviteData.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Mensagem do convidador:</strong><br />
                <span className="italic">"{inviteData.message}"</span>
              </p>
            </div>
          )}

          {/* Formulário de cadastro */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-700">Nome completo</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="handle" className="text-gray-700">Handle (nome de usuário)</Label>
              <Input
                id="handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="seu_handle"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Defina sua senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirme sua senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
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
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
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

          {/* Aviso */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Ao aceitar, você criará uma conta e será adicionado ao workspace automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
