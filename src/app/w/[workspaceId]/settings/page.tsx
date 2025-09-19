'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Users, Shield, Bell, Palette, Zap, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

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
    }
  }, [workspaceId])

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

  const [members, setMembers] = useState([
    {
      id: '1',
      name: 'Dev User',
      email: 'dev@example.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-15'
    },
    {
      id: '2', 
      name: 'João Silva',
      email: 'joao@example.com',
      role: 'member',
      status: 'active',
      joinedAt: '2024-02-20'
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  const handleSaveWorkspace = async () => {
    setIsLoading(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Salvar no localStorage para sincronizar com o sidebar
      if (typeof window !== 'undefined' && workspaceId) {
        localStorage.setItem(`workspace-${workspaceId}`, JSON.stringify(workspace))
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros do Workspace
                </CardTitle>
                <CardDescription>
                  Gerencie os membros e suas permissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
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
                            Desde {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                          {member.role === 'admin' ? 'Admin' : 'Membro'}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                          {member.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                  <Input
                    type="number"
                    value={settings.retentionDays}
                    onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-muted-foreground">
                    Mensagens serão arquivadas automaticamente após este período
                  </p>
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
