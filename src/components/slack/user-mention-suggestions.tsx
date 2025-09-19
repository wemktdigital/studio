'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AtSign, Search } from 'lucide-react'
import { useWorkspaceUsers } from '@/hooks/use-workspace-users'
import { cn } from '@/lib/utils'

interface UserMentionSuggestionsProps {
  query: string
  onSelectUser: (username: string) => void
  isVisible: boolean
  position: { x: number; y: number }
}

export function UserMentionSuggestions({
  query,
  onSelectUser,
  isVisible,
  position
}: UserMentionSuggestionsProps) {
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { users, isLoading } = useWorkspaceUsers()
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter users based on query
  useEffect(() => {
    if (!query || !users) {
      setFilteredUsers([])
      return
    }

    const searchTerm = query.toLowerCase().replace('@', '')
    const filtered = users.filter(user => 
      user.displayName.toLowerCase().includes(searchTerm) ||
      user.handle.toLowerCase().includes(searchTerm)
    ).slice(0, 8) // Limit to 8 suggestions

    setFilteredUsers(filtered)
    setSelectedIndex(0)
  }, [query, users])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredUsers.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredUsers.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev === 0 ? filteredUsers.length - 1 : prev - 1)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredUsers[selectedIndex]) {
            onSelectUser(filteredUsers[selectedIndex].handle)
          }
          break
        case 'Escape':
          e.preventDefault()
          onSelectUser('')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, filteredUsers, selectedIndex, onSelectUser])

  // Auto-scroll to selected item
  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isVisible || filteredUsers.length === 0) return null

  return (
    <div
      className="fixed z-50 bg-background border rounded-lg shadow-lg max-h-64 w-64"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="p-2 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AtSign className="h-4 w-4" />
          <span>Mencionar usuário</span>
        </div>
      </div>
      
      <ScrollArea className="max-h-48">
        <div ref={containerRef} className="p-1">
          {filteredUsers.map((user, index) => (
            <Button
              key={user.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-10 px-2",
                index === selectedIndex && "bg-accent"
              )}
              onClick={() => onSelectUser(user.handle)}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{user.displayName}</span>
                <span className="text-xs text-muted-foreground">@{user.handle}</span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {filteredUsers.length === 0 && !isLoading && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      )}
      
      {isLoading && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-2" />
          Carregando usuários...
        </div>
      )}
    </div>
  )
}
