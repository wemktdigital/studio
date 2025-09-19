'use client'

import { useState, useRef, useEffect } from 'react'
import { useDMMessagesNew } from '@/hooks/use-direct-messages-new'
import { useAuthContext } from '@/components/providers/auth-provider'
import MessageItem from '@/components/slack/message'
import DMMessageComposer from '@/components/slack/dm-message-composer'
import { User } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { useNormalizedUser, useMessageUsers } from '@/hooks/use-normalized-users'

interface DMChatNewProps {
  dmId: string
  otherUserId: string
  otherUser: User
  workspaceId: string
}

export default function DMChatNew({ dmId, otherUserId, otherUser, workspaceId }: DMChatNewProps) {
  const normalizedCurrentUser = useNormalizedUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  const {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage,
    isSendingMessage
  } = useDMMessagesNew(dmId)
  
  // ✅ NORMALIZAR: Usar hook para criar lista de usuários consistente
  const users = useMessageUsers(normalizedCurrentUser, otherUser)
  
  // ✅ DEBUG: Logs para diagnosticar problema de usuários
  console.log('🔍 DMChatNew: normalizedCurrentUser:', normalizedCurrentUser)
  console.log('🔍 DMChatNew: otherUser:', otherUser)
  console.log('🔍 DMChatNew: users array:', users)
  console.log('🔍 DMChatNew: users array length:', users.length)

  // Auto-scroll para baixo quando novas mensagens chegarem
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isScrolledToBottom])

  // Detectar scroll para controlar auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsScrolledToBottom(isAtBottom)
  }

  const handleSendMessage = async (content: string) => {
    if (!normalizedCurrentUser || !content.trim()) return

    console.log('DMChatNew: Sending message:', content)
    sendMessage({
      content: content.trim(),
      authorId: normalizedCurrentUser.id
    })
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando mensagens...</span>
        </div>
      </div>
    )
  }

  if (messagesError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar mensagens</h3>
          <p className="text-muted-foreground">Não foi possível carregar as mensagens desta conversa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Área de mensagens */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem ainda</h3>
              <p>Inicie uma conversa enviando uma mensagem!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              users={users}
              conversation={{
                id: dmId,
                type: 'dm',
                name: otherUser.display_name || otherUser.username || 'Usuário'
              }}
              workspaceId={workspaceId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer de mensagens */}
      <DMMessageComposer
        onSendMessageAction={handleSendMessage}
        placeholder={`Enviar mensagem para ${otherUser.display_name || otherUser.username || 'usuário'}...`}
        disabled={isSendingMessage}
      />
    </div>
  )
}
