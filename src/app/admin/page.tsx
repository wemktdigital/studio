'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { adminService, type SystemUser, type SystemWorkspace } from '@/lib/services/admin-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Users, 
  Building2, 
  Activity, 
  UserPlus, 
  Link as LinkIcon, 
  Unlink, 
  Trash2, 
  Edit, 
  ArrowLeft,
  RefreshCw,
  Search,
  MoreVertical,
  Crown
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Estados
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [workspaces, setWorkspaces] = useState<SystemWorkspace[]>([])
  const [stats, setStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modais
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [isLinkUserModalOpen, setIsLinkUserModalOpen] = useState(false)
  
  // Formulário de novo usuário
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    display_name: '',
    user_level: 'member' as any
  })

  // Formulário de vinculação
  const [linkData, setLinkData] = useState({
    user_id: '',
    workspace_id: '',
    role: 'member' as any
  })

  // Verificar se é super admin
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const isAdmin = await adminService.isSuperAdmin()
        
        if (!isAdmin) {
          toast({
            title: "Acesso Negado",
            description: "Apenas Super Admins podem acessar esta página.",
            variant: "destructive"
          })
          router.push('/w')
          return
        }

        setIsSuperAdmin(true)
        await loadData()
      } catch (error) {
        console.error('Error checking access:', error)
        router.push('/w')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkAccess()
    }
  }, [user, router])

  // Carregar dados
  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, workspacesData, statsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllWorkspaces(),
        adminService.getSystemStats()
      ])

      setUsers(usersData)
      setWorkspaces(workspacesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do sistema.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar usuário manualmente
  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.display_name) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive"
        })
        return
      }

      await adminService.createUserManually(newUser)
      
      toast({
        title: "Sucesso!",
        description: `Usuário ${newUser.email} criado com sucesso.`
      })

      setIsCreateUserModalOpen(false)
      setNewUser({ email: '', password: '', display_name: '', user_level: 'member' })
      await loadData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário.",
        variant: "destructive"
      })
    }
  }

  // Vincular usuário a workspace
  const handleLinkUser = async () => {
    try {
      if (!linkData.user_id || !linkData.workspace_id) {
        toast({
          title: "Erro",
          description: "Selecione um usuário e um workspace.",
          variant: "destructive"
        })
        return
      }

      await adminService.linkUserToWorkspace(linkData)
      
      toast({
        title: "Sucesso!",
        description: "Usuário vinculado ao workspace."
      })

      setIsLinkUserModalOpen(false)
      setLinkData({ user_id: '', workspace_id: '', role: 'member' })
      await loadData()
    } catch (error: any) {
      console.error('Error linking user:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao vincular usuário.",
        variant: "destructive"
      })
    }
  }

  // Desvincular usuário
  const handleUnlinkUser = async (userId: string, workspaceId: string) => {
    if (!confirm('Tem certeza que deseja desvincular este usuário?')) return

    try {
      await adminService.unlinkUserFromWorkspace(userId, workspaceId)
      toast({
        title: "Sucesso!",
        description: "Usuário desvinculado do workspace."
      })
      await loadData()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desvincular usuário.",
        variant: "destructive"
      })
    }
  }

  // Deletar usuário
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}?\nEsta ação é IRREVERSÍVEL!`)) return

    try {
      await adminService.deleteUser(userId)
      toast({
        title: "Sucesso!",
        description: "Usuário deletado do sistema."
      })
      await loadData()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar usuário.",
        variant: "destructive"
      })
    }
  }

  // Filtrar usuários
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando painel de administração...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/w')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                Painel de Administração
              </h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Super Admin
              </Badge>
            </div>
            <p className="text-muted-foreground ml-14">
              Gerencie usuários, workspaces e permissões do sistema
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Workspaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Canais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChannels}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs principais */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Vínculos
            </TabsTrigger>
          </TabsList>

          {/* ABA: USUÁRIOS */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>
                      Lista de todos os usuários do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateUserModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário por email ou nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Lista de usuários */}
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{u.display_name || 'Sem nome'}</p>
                          {u.user_level === 'super_admin' && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
                          {u.user_level === 'admin' && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {u.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {u.workspaces?.length || 0} workspace(s)
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setLinkData({ ...linkData, user_id: u.id })
                              setIsLinkUserModalOpen(true)
                            }}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Vincular a Workspace
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: WORKSPACES */}
          <TabsContent value="workspaces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Workspaces</CardTitle>
                <CardDescription>Lista de todos os workspaces do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workspaces.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{w.name}</p>
                          {w.is_active ? (
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{w.members_count} membros</span>
                          <span>{w.channels_count} canais</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/w/${w.id}/settings`)}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: VÍNCULOS */}
          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vínculos Usuário ↔ Workspace</CardTitle>
                    <CardDescription>
                      Gerencie as relações entre usuários e workspaces
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsLinkUserModalOpen(true)}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Criar Vínculo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => {
                    if (!u.workspaces || u.workspaces.length === 0) return null

                    return (
                      <div key={u.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{u.display_name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                          <Badge>{u.workspaces.length} workspace(s)</Badge>
                        </div>

                        <div className="space-y-2">
                          {u.workspaces.map((w) => (
                            <div
                              key={w.workspace_id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{w.workspace_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {w.role}
                                </Badge>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnlinkUser(u.id, w.workspace_id)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal: Criar Usuário */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um usuário manualmente ao sistema (sem convite)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@email.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="display_name">Nome Completo *</Label>
              <Input
                id="display_name"
                placeholder="João Silva"
                value={newUser.display_name}
                onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="user_level">Nível de Acesso</Label>
              <Select
                value={newUser.user_level}
                onValueChange={(value: any) => setNewUser({ ...newUser, user_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Vincular Usuário */}
      <Dialog open={isLinkUserModalOpen} onOpenChange={setIsLinkUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Workspace</DialogTitle>
            <DialogDescription>
              Adicione um usuário existente a um workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user">Usuário</Label>
              <Select
                value={linkData.user_id}
                onValueChange={(value) => setLinkData({ ...linkData, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.display_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workspace">Workspace</Label>
              <Select
                value={linkData.workspace_id}
                onValueChange={(value) => setLinkData({ ...linkData, workspace_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Cargo</Label>
              <Select
                value={linkData.role}
                onValueChange={(value: any) => setLinkData({ ...linkData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkUser}>
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

