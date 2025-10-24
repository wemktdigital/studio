'use client'

import React, { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { Message, User } from '@/lib/types'
import MessageItem from './message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from './user-avatar'
import { useDMMessagesSimple } from '@/hooks/use-dm-messages-simple'

interface DMMessageListSimpleProps {
  dmId: string
  userId: string
  workspaceId: string
}

const DateDivider = ({ date }: { date: Date }) => {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const getLabel = () => {
      if (isToday(date)) return 'Hoje'
      if (isYesterday(date)) return 'Ontem'
      return format(date, 'dd/MM/yyyy')
    }
    setLabel(getLabel())
  }, [date])
  
  if (!label) {
    return null
  }

  return (
    <div className="relative py-4" data-testid="date-divider">
      <Separator />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold">
          {label}
        </span>
      </div>
    </div>
  )
}

const EmptyDMWelcome = ({ userId }: { userId: string }) => {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <UserAvatar 
          user={{
            id: userId,
            displayName: 'Usuário',
            handle: 'usuario',
            avatarUrl: '',
            status: 'online'
          }} 
          className="h-8 w-8"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Nenhuma mensagem ainda</h3>
        <p className="text-muted-foreground">
          Seja o primeiro a enviar uma mensagem!
        </p>
      </div>
    </div>
  )
}

export default function DMMessageListSimple({ dmId, userId, workspaceId }: DMMessageListSimpleProps) {
  console.log('🚨🚨🚨 DMMessageListSimple: RENDERING NOW! 🚨🚨🚨', { 
    dmId,
    userId,
    workspaceId,
    timestamp: new Date().toISOString()
  })
  
  const { messages, users, isLoading, error } = useDMMessagesSimple(dmId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  console.log('🚨🚨🚨 DMMessageListSimple: useDMMessagesSimple result:', { 
    messageCount: messages.length, 
    userCount: users.length,
    isLoading, 
    error,
    messages: messages,
    users: users
  })

  if (isLoading) {
    console.log('🚨🚨🚨 DMMessageListSimple: Loading state')
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('🚨🚨🚨 DMMessageListSimple: Error state:', error)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Erro ao carregar mensagens: {error.message}</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    console.log('🚨🚨🚨 DMMessageListSimple: NO MESSAGES, showing empty state')
    return <EmptyDMWelcome userId={userId} />
  }

  console.log('🚨🚨🚨 DMMessageListSimple: HAS MESSAGES, processing', messages.length, 'messages')

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    // Validate and handle invalid dates
    let date: Date;
    try {
      date = new Date(message.createdAt);
      // Check if date is valid
      if (isNaN(date.getTime()) || !message.createdAt) {
        console.warn('Invalid date for message:', message.id, 'createdAt:', message.createdAt);
        date = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn('Error parsing date for message:', message.id, 'createdAt:', message.createdAt, error);
      date = new Date(); // Fallback to current date
    }
    
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    
    return groups;
  }, {} as Record<string, Message[]>);

  console.log('🚨🚨🚨 DMMessageListSimple: Grouped messages:', Object.keys(groupedMessages))

  // Create a mock conversation object for the header
  const mockConversation = {
    id: dmId,
    workspaceId: workspaceId,
    name: `DM with ${userId}`,
    description: '',
    isPrivate: true,
    unreadCount: 0,
    members: []
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea 
        className="h-full"
        onScrollCapture={handleScroll}
      >
        <div className="p-4 space-y-4">
          {Object.entries(groupedMessages)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([dateKey, dayMessages]) => (
              <div key={dateKey} className="space-y-4">
                {/* Date separator */}
                <DateDivider date={new Date(dateKey)} />

                {/* Messages for this date */}
                {dayMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    users={users}
                    conversation={mockConversation}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          className="absolute bottom-4 right-4 rounded-full shadow-lg"
        >
          ↓
        </Button>
      )}
    </div>
  )
}
