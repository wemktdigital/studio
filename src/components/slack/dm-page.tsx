'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './user-avatar'
import DMMessageList from './dm-message-list'
import DMMessageComposer from './dm-message-composer'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDMMessages } from '@/hooks/use-direct-messages'

interface DMPageProps {
  workspaceId: string
  userId: string
  users: any[]
}

export default function DMPage({ workspaceId, userId, users }: DMPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUser = users.find(u => u.id === userId)
  
  // ✅ ADICIONADO: Hook para enviar mensagens
  const { sendMessage, isSending } = useDMMessages(`dm-${userId}`)
  
  const handleBackClick = () => {
    // Remove o parâmetro dm da URL
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('dm')
    const newUrl = newSearchParams.toString() 
      ? `/w/${workspaceId}?${newSearchParams.toString()}`
      : `/w/${workspaceId}`
    router.replace(newUrl, { scroll: false })
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    await sendMessage({ content })
  }

  if (!targetUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Usuário não encontrado</h2>
          <p className="text-muted-foreground mb-4">O usuário que você está procurando não existe ou não está disponível.</p>
          <Button onClick={handleBackClick} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <UserAvatar user={targetUser} size="sm" />
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {targetUser.displayName || targetUser.email || 'Usuário'}
          </h1>
          <p className="text-sm text-muted-foreground">Mensagem direta</p>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <DMMessageList 
          dmId={`dm-${userId}`}
          userId={userId}
          workspaceId={workspaceId}
        />
      </div>

      {/* Message Composer - Always visible at bottom */}
      <div className="flex-shrink-0">
        <DMMessageComposer 
          onSendMessageAction={handleSendMessage}
          placeholder={`Enviar mensagem para ${targetUser.displayName || targetUser.email || 'usuário'}...`}
          disabled={isSending}
        />
      </div>
    </div>
  )
}
