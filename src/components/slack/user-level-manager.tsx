'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Crown, Shield, User, Users, Settings, AlertTriangle, Loader2 } from 'lucide-react'
import { useUserLevels } from '@/hooks/use-user-levels'
import { useWorkspaceUsersAdmin } from '@/hooks/use-workspace-users-admin'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const levelIcons = {
  super_admin: Crown,
  admin: Shield,
  manager: Settings,
  member: User,
  guest: Users,
  banned: AlertTriangle
}

const levelColors = {
  super_admin: 'bg-purple-500 text-white',
  admin: 'bg-red-500 text-white',
  manager: 'bg-blue-500 text-white',
  member: 'bg-green-500 text-white',
  guest: 'bg-gray-500 text-white',
  banned: 'bg-black text-white'
}

interface UserLevelManagerProps {
  workspaceId: string
}

export function UserLevelManager({ workspaceId }: UserLevelManagerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState<string>('')
  
  const { 
    currentUserLevel, 
    can, 
    updateUserLevel,
    isLoadingUserLevel 
  } = useUserLevels()
  
  const {
    workspaceUsers,
    isLoadingUsers,
    updateUserLevel: updateWorkspaceUserLevel
  } = useWorkspaceUsersAdmin(workspaceId)
  
  const { toast } = useToast()

  // Listen for custom event to open the manager
  useEffect(() => {
    const handleOpenManager = () => {
      setIsVisible(true)
    }

    window.addEventListener('openUserLevelManager', handleOpenManager)
    return () => window.removeEventListener('openUserLevelManager', handleOpenManager)
  }, [])

  // Only show if user has permission
  if (!can.manageUsers()) {
    return null
  }

  const handleUpdateUserLevel = async () => {
    if (!selectedUser || !newLevel) return

    try {
      await updateWorkspaceUserLevel.mutateAsync({ 
        userId: selectedUser, 
        newLevel 
      })
      
      toast({
        title: 'Nível atualizado',
        description: `Usuário atualizado para ${newLevel}`,
      })
      
      setSelectedUser(null)
      setNewLevel('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o nível do usuário',
        variant: 'destructive',
      })
    }
  }

  // Don't render the floating button anymore - it's now in the sidebar
  if (!isVisible) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-80 shadow-lg max-h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Gerenciar Níveis
            {currentUserLevel && (
              <Badge 
                className={cn(
                  "h-5 px-2 text-xs",
                  levelColors[currentUserLevel.userLevel]
                )}
              >
                {currentUserLevel.userLevel.replace('_', ' ')}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {/* Current User Info */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Seu Nível</h4>
              {isLoadingUserLevel ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : currentUserLevel ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserLevel.avatarUrl} alt={currentUserLevel.displayName} />
                    <AvatarFallback>{currentUserLevel.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{currentUserLevel.displayName}</p>
                    <Badge 
                      className={cn(
                        "text-xs",
                        levelColors[currentUserLevel.userLevel]
                      )}
                    >
                      {currentUserLevel.userLevel.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              )}
            </div>

            {/* Level Management */}
            {can.isSuperAdmin() && (
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">Atualizar Nível de Usuário</h4>
                <div className="space-y-2">
                  <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm">Carregando usuários...</span>
                        </div>
                      ) : workspaceUsers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum usuário encontrado
                        </div>
                      ) : (
                        workspaceUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-xs">
                                  {user.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{user.displayName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.userLevel} • {user.status}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Select value={newLevel} onValueChange={setNewLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Novo nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleUpdateUserLevel}
                    disabled={!selectedUser || !newLevel || updateWorkspaceUserLevel.isPending}
                    className="w-full"
                  >
                    {updateWorkspaceUserLevel.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Atualizar Nível'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Level Information */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Níveis Disponíveis</h4>
              <div className="space-y-2">
                {Object.entries(levelIcons).map(([level, Icon]) => (
                  <div key={level} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" />
                    <Badge 
                      className={cn(
                        "text-xs",
                        levelColors[level as keyof typeof levelColors]
                      )}
                    >
                      {level.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
