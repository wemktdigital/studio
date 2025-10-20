'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Users, Shield, Bell, Palette, Zap, Trash2, Save, Plus, X, UserPlus, CheckCircle, Key, UserCheck, UserX, Eye, EyeOff, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { messageRetentionService } from '@/lib/services/message-retention-service'
import { useWorkspaceUsersAdmin } from '@/hooks/use-workspace-users-admin'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workspaceId = params.workspaceId as string

  const [workspace, setWorkspace] = useState({
    name: 'WE Marketing',
    description: 'Workspace principal da equipe de marketing',
    avatar: null,
    isActive: true
  })

  const [settings, setSettings] = useState({
    allowInvites: true,
    requireApproval: false,
    allowGuestAccess: false,
    enableNotifications: true,
    enableSound: true,
    enableDarkMode: true,
    autoArchive: false,
    retentionDays: 30
  })

  // Carregar dados do workspace do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      const saved = localStorage.getItem(`workspace-${workspaceId}`)
      if (saved) {
        try {
          const workspaceData = JSON.parse(saved)
          setWorkspace(workspaceData)
        } catch (error) {
          console.error('Error parsing saved workspace data:', error)
        }
      }

      // Carregar configurações salvas
      const savedSettings = localStorage.getItem(`workspace-settings-${workspaceId}`)
      if (savedSettings) {
        try {
          const settingsData = JSON.parse(savedSettings)
          setSettings(settingsData)
        } catch (error) {
          console.error('Error parsing saved settings data:', error)
        }
      }
    }
  }, [workspaceId])

  // Carregar estatísticas de retenção
  useEffect(() => {
    const loadRetentionStats = async () => {
      if (workspaceId && settings.retentionDays) {
        try {
          const stats = await messageRetentionService.getRetentionStats(workspaceId, settings.retentionDays)
          setRetentionStats(stats)
        } catch (error) {
          console.error('Erro ao carregar estatísticas de retenção:', error)
        }
      }
    }

    loadRetentionStats()
  }, [workspaceId, settings.retentionDays])

  // Usar dados reais do workspace em vez de dados dummy
  const { workspaceUsers, isLoading: isLoadingMembers } = useWorkspaceUsersAdmin(workspaceId)

  const [isLoading, setIsLoading] = useState(false)
  
  // Converter dados do hook para o formato esperado pela UI
  const members = workspaceUsers.map(user => ({
    id: user.id,
    name: user.displayName,
    email: user.email || 'N/A',
    role: user.userLevel === 'super_admin' ? 'admin' : user.userLevel,
    status: user.status === 'online' ? 'active' : 'inactive',
    joinedAt: user.joinedAt
  }))
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [retentionStats, setRetentionStats] = useState({
    totalMessages: 0,
    messagesToArchive: 0,
    archivedMessages: 0,
    oldestMessage: null as string | null,
    newestMessage: null as string | null
  })
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member'
  })
  
  // Estados para link compartilhável
  const [sharedInviteLink, setSharedInviteLink] = useState<string | null>(null)
  const [sharedInviteToken, setSharedInviteToken] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [showInviteLink, setShowInviteLink] = useState(false)

  const handleSaveWorkspace = async () => {
    setIsLoading(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Salvar no localStorage para sincronizar com o sidebar
      if (typeof window !== 'undefined' && workspaceId) {
        localStorage.setItem(`workspace-${workspaceId}`, JSON.stringify(workspace))
        localStorage.setItem(`workspace-settings-${workspaceId}`, JSON.stringify(settings))
      }
      
      // Se a retenção de mensagens foi alterada, processar arquivamento
      if (settings.retentionDays && settings.retentionDays > 0) {
        await processMessageRetention()
      }
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do workspace foram atualizadas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processMessageRetention = async () => {
    try {
      console.log(`🗄️ Iniciando processamento de retenção de mensagens...`)
      
      const result = await messageRetentionService.processMessageRetention({
        retentionDays: settings.retentionDays,
        autoArchive: settings.autoArchive,
        workspaceId: workspaceId
      })
      
      if (result.errors.length > 0) {
        console.warn('Avisos durante o processamento:', result.errors)
        toast({
          title: "Arquivamento concluído com avisos",
          description: `${result.archivedCount} mensagens arquivadas. ${result.errors.length} avisos.`,
          variant: "destructive"
        })
      } else if (result.archivedCount > 0) {
        toast({
          title: "Arquivamento concluído",
          description: `${result.archivedCount} mensagens foram arquivadas automaticamente.`,
        })
      } else {
        toast({
          title: "Nenhuma mensagem para arquivar",
          description: "Todas as mensagens estão dentro do período de retenção.",
        })
      }
      
      console.log(`✅ Processamento concluído: ${result.archivedCount} mensagens arquivadas`)
      
    } catch (error) {
      console.error('Erro ao processar retenção de mensagens:', error)
      toast({
        title: "Erro no arquivamento",
        description: "Não foi possível processar o arquivamento de mensagens.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!confirm('Tem certeza que deseja excluir este workspace? Esta ação não pode ser desfeita.')) {
      return
    }

    setIsLoading(true)
    try {
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Workspace excluído",
        description: "O workspace foi excluído com sucesso.",
      })
      
      router.push('/w')
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o workspace.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'member': return 'secondary'
      case 'guest': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'pending': return 'outline'
      default: return 'secondary'
    }
  }

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      })
      return
    }

    // Verificar se o email já existe
    const emailExists = members.some(member => member.email === newMember.email)
    if (emailExists) {
      toast({
        title: "Erro",
        description: "Este email já está sendo usado por outro membro.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Enviar convite real via API
      const response = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMember.email,
          workspaceId: workspaceId,
          role: newMember.role,
          message: `Olá ${newMember.name}, você foi convidado para participar do workspace!`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar convite')
      }

      // Não precisamos mais manipular estado local - os dados vêm do hook
      setNewMember({ name: '', email: '', role: 'member' })
      setIsAddMemberDialogOpen(false)
      
      console.log('✅ Convite enviado com sucesso:', {
        email: newMember.email,
        inviteToken: result.data?.invite?.token,
        emailStats: result.data?.emailStats
      })
      
      toast({
        title: "Convite enviado!",
        description: `Um convite foi enviado para ${newMember.email}. Eles receberão um email com instruções para acessar o workspace.`,
      })
    } catch (error: any) {
      console.error('❌ Erro ao enviar convite:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o convite.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvite = async (email: string, name: string) => {
    setIsLoading(true)
    try {
      // Reenviar convite via API
      const response = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          workspaceId: workspaceId,
          role: 'member',
          message: `Olá ${name}, você foi convidado para participar do workspace!`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reenviar convite')
      }

      // Não precisamos mais manipular estado local - os dados vêm do hook
      
      console.log('✅ Convite reenviado:', { email, inviteToken: result.data?.invite?.token })
      
      toast({
        title: "Convite reenviado!",
        description: `Um novo convite foi enviado para ${email}.`,
      })
    } catch (error: any) {
      console.error('❌ Erro ao reenviar convite:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível reenviar o convite.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInviteLink = async () => {
    setIsGeneratingLink(true)
    try {
      const response = await fetch('/api/workspace/invite-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspaceId,
          role: 'member',
          expiresInDays: 7
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar link de convite')
      }

      setSharedInviteLink(result.data.inviteUrl)
      setSharedInviteToken(result.data.inviteToken)
      setShowInviteLink(true)
      
      console.log('✅ Link de convite gerado:', {
        inviteUrl: result.data.inviteUrl,
        expiresAt: result.data.expiresAt
      })
      
      toast({
        title: "Link de convite gerado!",
        description: "Link copiado para a área de transferência.",
      })

      // Copiar para área de transferência
      await navigator.clipboard.writeText(result.data.inviteUrl)
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar link de convite:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o link de convite.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyInviteLink = async () => {
    if (sharedInviteLink) {
      try {
        await navigator.clipboard.writeText(sharedInviteLink)
        toast({
          title: "Link copiado!",
          description: "Link de convite copiado para a área de transferência.",
        })
      } catch (error) {
        console.error('❌ Erro ao copiar link:', error)
        toast({
          title: "Erro",
          description: "Não foi possível copiar o link.",
          variant: "destructive"
        })
      }
    }
  }

  const handleCancelInviteLink = async () => {
    if (sharedInviteToken) {
      try {
        const response = await fetch(`/api/workspace/invite-link?token=${sharedInviteToken}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setSharedInviteLink(null)
          setSharedInviteToken(null)
          setShowInviteLink(false)
          
          toast({
            title: "Link cancelado!",
            description: "O link de convite foi cancelado com sucesso.",
          })
        } else {
          throw new Error('Erro ao cancelar link')
        }
      } catch (error: any) {
        console.error('❌ Erro ao cancelar link:', error)
        toast({
          title: "Erro",
          description: error.message || "Não foi possível cancelar o link.",
          variant: "destructive"
        })
      }
    }
  }

  const handleApproveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja aprovar ${memberName} manualmente?`)) {
      return
    }

    setIsLoading(true)
    try {
      // Simular aprovação manual
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Não precisamos mais manipular estado local - os dados vêm do hook
      
      toast({
        title: "Membro aprovado!",
        description: `${memberName} foi aprovado e agora tem acesso ao workspace.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o membro.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simular alteração de senha
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Senha alterada!",
        description: `A senha de ${selectedMember.name} foi alterada com sucesso.`,
      })
      
      setNewPassword('')
      setIsPasswordDialogOpen(false)
      setSelectedMember(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMemberStatus = async (memberId: string, memberName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? 'ativar' : 'desativar'
    
    if (!confirm(`Tem certeza que deseja ${action} ${memberName}?`)) {
      return
    }

    setIsLoading(true)
    try {
      // Simular alteração de status
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Não precisamos mais manipular estado local - os dados vêm do hook
      
      toast({
        title: `Membro ${action}do!`,
        description: `${memberName} foi ${action}do com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível ${action} o membro.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} do workspace?`)) {
      return
    }

    setIsLoading(true)
    try {
      // Simular remoção de membro
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Não precisamos mais manipular estado local - os dados vêm do hook
      
      toast({
        title: "Membro removido",
        description: `${memberName} foi removido do workspace.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Configurações do Workspace</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSaveWorkspace}
              disabled={isLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 flex-1 overflow-y-auto">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>

          {/* Geral */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informações do Workspace
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas do seu workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Nome do Workspace</Label>
                  <Input
                    id="workspace-name"
                    value={workspace.name}
                    onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
                    placeholder="Nome do workspace"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workspace-description">Descrição</Label>
                  <Textarea
                    id="workspace-description"
                    value={workspace.description}
                    onChange={(e) => setWorkspace({...workspace, description: e.target.value})}
                    placeholder="Descreva o propósito deste workspace"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="workspace-active"
                    checked={workspace.isActive}
                    onCheckedChange={(checked) => setWorkspace({...workspace, isActive: checked})}
                  />
                  <Label htmlFor="workspace-active">Workspace ativo</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure as preferências de notificação do workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações habilitadas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações de mensagens e atividades
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sons de notificação</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir sons quando receber notificações
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableSound}
                    onCheckedChange={(checked) => setSettings({...settings, enableSound: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar tema escuro por padrão
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableDarkMode}
                    onCheckedChange={(checked) => setSettings({...settings, enableDarkMode: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membros */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Membros do Workspace
                    </CardTitle>
                    <CardDescription>
                      Gerencie os membros e suas permissões
                    </CardDescription>
                  </div>
                  <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Adicionar Membro
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Membro</DialogTitle>
                        <DialogDescription>
                          Adicione um novo membro ao workspace. Eles receberão um convite por email.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="member-name">Nome completo</Label>
                          <Input
                            id="member-name"
                            value={newMember.name}
                            onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                            placeholder="João Silva"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="member-email">Email</Label>
                          <Input
                            id="member-email"
                            type="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                            placeholder="joao@exemplo.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="member-role">Função</Label>
                          <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddMemberDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAddMember}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          {isLoading ? 'Adicionando...' : 'Adicionar Membro'}
                        </Button>
                      </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  
                  {/* Dialog para alterar senha */}
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                          Defina uma nova senha para {selectedMember?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="new-password">Nova senha</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
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
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsPasswordDialogOpen(false)
                            setNewPassword('')
                            setSelectedMember(null)
                          }}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleChangePassword}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          {isLoading ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              <CardContent>
                <div className="space-y-3">
                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-medium mb-2">Nenhum membro encontrado</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione membros ao workspace para começar a colaborar.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setIsAddMemberDialogOpen(true)}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Adicionar Primeiro Membro
                      </Button>
                    </div>
                  ) : isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.status === 'active' && member.joinedAt 
                                ? `Desde ${new Date(member.joinedAt).toLocaleDateString('pt-BR')}`
                                : member.status === 'pending' 
                                  ? `Convite enviado em ${new Date(member.inviteSentAt).toLocaleDateString('pt-BR')}`
                                  : 'Membro inativo'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                            {member.role === 'admin' ? 'Admin' : 'Membro'}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                            {member.status === 'active' ? 'Ativo' : member.status === 'pending' ? 'Pendente' : 'Inativo'}
                          </Badge>
                          
                          {/* Ações para membros pendentes */}
                          {member.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveMember(member.id, member.name)}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(member.email, member.name)}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs"
                              >
                                Reenviar
                              </Button>
                            </>
                          )}
                          
                          {/* Ações para membros ativos */}
                          {member.status === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setIsPasswordDialogOpen(true)
                                }}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <Key className="h-3 w-3" />
                                Senha
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleMemberStatus(member.id, member.name, member.status)}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <UserX className="h-3 w-3" />
                                Desativar
                              </Button>
                            </>
                          )}
                          
                          {/* Ações para membros inativos */}
                          {member.status === 'inactive' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setIsPasswordDialogOpen(true)
                                }}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <Key className="h-3 w-3" />
                                Senha
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleMemberStatus(member.id, member.name, member.status)}
                                disabled={isLoading}
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <UserCheck className="h-3 w-3" />
                                Ativar
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Convites e Acesso</CardTitle>
                <CardDescription>
                  Configure como novos membros podem ingressar no workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir convites</Label>
                    <p className="text-sm text-muted-foreground">
                      Membros podem convidar outras pessoas
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowInvites}
                    onCheckedChange={(checked) => setSettings({...settings, allowInvites: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requer aprovação</Label>
                    <p className="text-sm text-muted-foreground">
                      Novos membros precisam ser aprovados
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireApproval}
                    onCheckedChange={(checked) => setSettings({...settings, requireApproval: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Acesso de convidados</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir acesso limitado para convidados
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowGuestAccess}
                    onCheckedChange={(checked) => setSettings({...settings, allowGuestAccess: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Link de Convite Compartilhável</Label>
                    <p className="text-sm text-muted-foreground">
                      Gere um link que pode ser compartilhado para que pessoas se juntem ao workspace automaticamente
                    </p>
                  </div>

                  {!showInviteLink ? (
                    <Button 
                      onClick={handleGenerateInviteLink}
                      disabled={isGeneratingLink}
                      className="w-full"
                    >
                      {isGeneratingLink ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Gerando Link...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Gerar Link de Convite
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Link de Convite Ativo</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={sharedInviteLink || ''}
                            readOnly
                            className="flex-1 font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyInviteLink}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancelInviteLink}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ⏰ Este link expira em 7 dias. Compartilhe com pessoas que você quer convidar para o workspace.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissões */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões e Segurança
                </CardTitle>
                <CardDescription>
                  Configure as permissões e políticas de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Retenção de mensagens (dias)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={settings.retentionDays}
                      onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                      placeholder="30"
                      min="1"
                      max="365"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={processMessageRetention}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Arquivar Agora
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mensagens serão arquivadas automaticamente após este período. Use "Arquivar Agora" para processar imediatamente.
                  </p>
                  
                  {/* Estatísticas de retenção */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Estatísticas de Retenção</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/w/${workspaceId}/audit`)}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Ver Auditoria</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total de mensagens:</span>
                        <span className="ml-2 font-medium">{retentionStats.totalMessages}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Para arquivar:</span>
                        <span className="ml-2 font-medium text-orange-600">{retentionStats.messagesToArchive}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Já arquivadas:</span>
                        <span className="ml-2 font-medium text-green-600">{retentionStats.archivedMessages}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mensagem mais antiga:</span>
                        <span className="ml-2 font-medium text-xs">
                          {retentionStats.oldestMessage 
                            ? new Date(retentionStats.oldestMessage).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Arquivamento automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Arquivar canais inativos automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoArchive}
                    onCheckedChange={(checked) => setSettings({...settings, autoArchive: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Integrações
                </CardTitle>
                <CardDescription>
                  Conecte ferramentas externas ao seu workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-medium mb-2">Integrações em breve</h3>
                  <p className="text-sm text-muted-foreground">
                    Em breve você poderá conectar ferramentas como Google Drive, GitHub, Trello e muito mais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive text-base">Zona de Perigo</CardTitle>
            <CardDescription className="text-sm">
              Ações irreversíveis que afetam permanentemente o workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Excluir Workspace</h4>
                <p className="text-xs text-muted-foreground">
                  Exclui permanentemente este workspace e todos os seus dados
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteWorkspace}
                disabled={isLoading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
