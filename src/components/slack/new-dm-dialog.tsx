'use client'

import { useState } from 'react'
import { Search, User, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from './user-avatar'
import { useDirectMessages } from '@/hooks/use-direct-messages'
import { useWorkspaceUsers } from '@/hooks/use-workspace-users'
import { useAuthContext } from '@/components/providers/auth-provider'
import { cn } from '@/lib/utils'

interface NewDMDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSelectUser: (userId: string) => void
}

export function NewDMDialog({ 
  isOpen, 
  onOpenChange, 
  workspaceId, 
  onSelectUser 
}: NewDMDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { user: currentUser } = useAuthContext()
  const { users, isLoading: usersLoading } = useWorkspaceUsers(workspaceId)
  const { directMessages, createDirectMessage, isCreating } = useDirectMessages(workspaceId)

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (user.id === currentUser?.id) return false // Don't show current user
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.handle?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    )
  })

  // Get users who already have DMs
  const usersWithDMs = directMessages.map(dm => dm.userId)
  const usersWithoutDMs = filteredUsers.filter(user => !usersWithDMs.includes(user.id))
  const usersWithExistingDMs = filteredUsers.filter(user => usersWithDMs.includes(user.id))

  const handleUserClick = async (userId: string) => {
    try {
      // Check if DM already exists
      const existingDM = directMessages.find(dm => dm.userId === userId)
      
      if (existingDM) {
        // Just open the existing DM
        onSelectUser(userId)
        onOpenChange(false)
        return
      }

      // Create new DM
      await createDirectMessage({ otherUserId: userId })
      
      // Open the new DM
      onSelectUser(userId)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating DM:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa Direta</DialogTitle>
          <DialogDescription>
            Escolha um usuário para iniciar uma conversa direta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-64">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando usuários...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Users without existing DMs */}
                {usersWithoutDMs.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Iniciar Nova Conversa
                    </div>
                    {usersWithoutDMs.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        disabled={isCreating}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <UserAvatar user={user} className="h-8 w-8" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.displayName || user.email?.split('@')[0] || 'Usuário'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.handle || user.email}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </>
                )}

                {/* Users with existing DMs */}
                {usersWithExistingDMs.length > 0 && (
                  <>
                    {usersWithoutDMs.length > 0 && (
                      <div className="border-t pt-2 mt-4">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Conversas Existentes
                        </div>
                      </div>
                    )}
                    {usersWithExistingDMs.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <UserAvatar user={user} className="h-8 w-8" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.displayName || user.email?.split('@')[0] || 'Usuário'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.handle || user.email}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Conversa existente
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* No users found */}
                {filteredUsers.length === 0 && !usersLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        {searchQuery.trim() ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}