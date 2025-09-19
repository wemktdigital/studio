'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Mail, Copy, Send, UserPlus } from 'lucide-react'

interface InvitePeopleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  workspaceName: string
}

export function InvitePeopleDialog({ 
  isOpen, 
  onOpenChange, 
  workspaceId, 
  workspaceName 
}: InvitePeopleDialogProps) {
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link'>('email')
  const [emails, setEmails] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const inviteLink = `${window.location.origin}/w/${workspaceId}/invite`

  const handleEmailInvite = async () => {
    if (!emails.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira pelo menos um email.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
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
          message,
          inviterName: 'Usuário atual' // Em produção, você pegaria o nome do usuário logado
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
      onOpenChange(false)
    } catch (error) {
      console.error('Error sending invites:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível enviar os convites. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link copiado",
        description: "Link de convite copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    setEmails('')
    setMessage('')
    setInviteMethod('email')
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar pessoas para {workspaceName}
          </DialogTitle>
          <DialogDescription>
            Convide novos membros para participar do workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Método de convite</Label>
            <Select value={inviteMethod} onValueChange={(value: 'email' | 'link') => setInviteMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Enviar por email</SelectItem>
                <SelectItem value="link">Compartilhar link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteMethod === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="emails">Emails dos convidados</Label>
                <Textarea
                  id="emails"
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separe múltiplos emails com vírgulas
                </p>
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
            </>
          ) : (
            <div className="space-y-2">
              <Label>Link de convite</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link com as pessoas que deseja convidar
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {inviteMethod === 'email' ? (
            <Button onClick={handleEmailInvite} disabled={isLoading} className="gap-2">
              <Send className="h-4 w-4" />
              {isLoading ? 'Enviando...' : 'Enviar convites'}
            </Button>
          ) : (
            <Button onClick={handleClose} className="gap-2">
              <Copy className="h-4 w-4" />
              Concluído
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
