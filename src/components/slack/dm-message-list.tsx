'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useDMMessages } from '@/hooks/use-direct-messages'
import MessageItem from './message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from './user-avatar'

interface DMMessageListProps {
  dmId: string
  userId: string
  workspaceId: string
}

const DMMessageList = React.memo(function DMMessageList({ dmId, userId, workspaceId }: DMMessageListProps) {
  const { messages, isLoading, error } = useDMMessages(dmId)

  // ✅ ADICIONADO: Extrair usuários únicos das mensagens
  const users = useMemo(() => {
    if (!messages || messages.length === 0) return []
    
    const uniqueUsers = new Map()
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      if (message.author && Object.keys(message.author).length > 0) {
        uniqueUsers.set(message.author.id, {
          id: message.author.id,
          displayName: message.author.displayName || message.author.display_name,
          handle: message.author.handle,
          avatarUrl: message.author.avatarUrl || message.author.avatar_url,
          status: message.author.status
        })
      }
    }
    
    return Array.from(uniqueUsers.values())
  }, [messages])
  
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: any[] } = {}
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    }
    
    return groups
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  const formatDateHeader = (dateString: string) => {
    let date: Date
    try {
      date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string for header:', dateString)
        date = new Date() // Fallback to current date
      }
    } catch (error) {
      console.warn('Error parsing date string for header:', dateString, error)
      date = new Date() // Fallback to current date
    }
    
    if (isToday(date)) {
      return 'Hoje'
    } else if (isYesterday(date)) {
      return 'Ontem'
    } else {
      return format(date, 'dd/MM/yyyy')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Carregando mensagens...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-red-500">Erro ao carregar mensagens</div>
          <div className="text-xs text-muted-foreground mt-1">{error.message}</div>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Nenhuma mensagem ainda</div>
          <div className="text-xs text-muted-foreground mt-1">Seja o primeiro a enviar uma mensagem!</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 h-full"
        onScrollCapture={handleScroll}
      >
        <div className="p-4 space-y-4">
          {Object.entries(groupedMessages)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([dateKey, dayMessages]) => (
              <div key={dateKey} className="space-y-4">
                {/* Date separator */}
                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground bg-background px-2 whitespace-nowrap">
                    {formatDateHeader(dateKey)}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages for this date */}
                {dayMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    users={users}
                    conversation={{
                      id: dmId,
                      workspaceId: workspaceId,
                      name: `DM with ${userId}`,
                      description: '',
                      isPrivate: true,
                      unreadCount: 0,
                      members: []
                    }}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            ))}
        </div>
        
        {/* Scroll anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
        >
          ↓
        </Button>
      )}
    </div>
  )
})

export default DMMessageList
