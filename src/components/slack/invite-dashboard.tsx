'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useInvites } from '@/hooks/use-invites'
import { 
  Mail, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Trash2,
  Copy,
  UserPlus
} from 'lucide-react'

interface InviteDashboardProps {
  workspaceId: string
  workspaceName: string
}

export function InviteDashboard({ workspaceId, workspaceName }: InviteDashboardProps) {
  const { invites, isLoading, error, refreshInvites, cancelInvite, inviteStats } = useInvites(workspaceId)
  const { toast } = useToast()

  const [emails, setEmails] = useState('')
  const [message, setMessage] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [isSending, setIsSending] = useState(false)

  const handleSendInvites = async () => {
    if (!emails.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira pelo menos um email.",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails,
          workspaceId,
          workspaceName,
          message: message || null,
          role,
          inviterName: 'Usuário atual'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convites')
      }

      toast({
        title: "Convites enviados",
        description: data.message,
      })
      
      setEmails('')
      setMessage('')
      refreshInvites()
    } catch (error: any) {
      console.error('Error sending invites:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar os convites. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCancelInvite = async (inviteId: string, email: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja cancelar o convite para ${email}?`)
    
    if (confirmed) {
      await cancelInvite(inviteId)
    }
  }

  const { copy } = useCopyToClipboard()

  const handleCopyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`
    const success = await copy(inviteLink)
    if (success) {
      toast({
        title: "Link copiado",
        description: "Link de convite copiado para a área de transferência.",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Aceito</Badge>
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expirado</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Erro ao carregar convites</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={refreshInvites} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{inviteStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aceitos</p>
                <p className="text-2xl font-bold text-green-600">{inviteStats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{inviteStats.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{inviteStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar novos membros
          </CardTitle>
          <CardDescription>
            Convide pessoas para participar do workspace {workspaceName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Emails dos convidados</Label>
              <Textarea
                id="emails"
                placeholder="email1@exemplo.com, email2@exemplo.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Separe múltiplos emails com vírgulas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Olá! Você foi convidado para participar do nosso workspace..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSendInvites} 
            disabled={isSending || !emails.trim()}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            {isSending ? 'Enviando...' : 'Enviar Convites'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de convites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Convites enviados</CardTitle>
            <CardDescription>
              Histórico de todos os convites enviados para este workspace
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshInvites} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando convites...</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum convite enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(invite.status)}
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-gray-600">
                        Convidado por {invite.inviterName} • {formatDate(invite.createdAt)}
                      </p>
                      {invite.message && (
                        <p className="text-sm text-gray-500 italic mt-1">
                          "{invite.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invite.status)}
                    
                    {invite.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInviteLink(invite.id)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar Link
                      </Button>
                    )}
                    
                    {invite.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id, invite.email)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
