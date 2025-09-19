'use client'

import { useState, useEffect, useRef } from 'react'
import { useChannelMessages } from '@/hooks/use-messages'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ChannelHeader from './channel-header'
import MessageList from './message-list'
import MessageComposer from './message-composer'
import RightPane from './right-pane'

interface FunctionalChatProps {
  channelId: string
  channelName: string
  workspaceId: string
}

export default function FunctionalChat({ channelId, channelName, workspaceId }: FunctionalChatProps) {
  console.log('🔍 FunctionalChat: Props:', { channelId, channelName, workspaceId });
  
  const { user } = useAuthContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, users, isLoading, error } = useChannelMessages(channelId)

  console.log('🔍 FunctionalChat: useChannelMessages result:', { 
    messages: messages?.length || 0, 
    users: users?.length || 0, 
    isLoading, 
    error 
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    console.log('🔍 FunctionalChat: Loading state');
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('🔍 FunctionalChat: Error state:', error);
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error loading messages: {error.message}</p>
        </div>
      </div>
    )
  }

  // Create a mock channel object for the header
  const mockChannel = {
    id: channelId,
    workspaceId: workspaceId,
    name: channelName,
    description: `Canal ${channelName}`,
    isPrivate: false,
    unreadCount: 0,
    members: []
  }

  console.log('🔍 FunctionalChat: Rendering with mockChannel:', mockChannel);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Channel Header with Search Button */}
      <ChannelHeader 
        conversation={mockChannel} 
        workspaceId={workspaceId}
      />

      {/* Messages using MessageList component */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          users={users} 
          conversation={mockChannel}
          workspaceId={workspaceId}
        />
      </div>

      {/* ✅ ATUALIZADO: Usar MessageComposer integrado */}
      <MessageComposer 
        conversation={mockChannel}
        channelId={channelId}
        workspaceId={workspaceId}
      />
      
      <div ref={messagesEndRef} />
    </div>
  )
}
