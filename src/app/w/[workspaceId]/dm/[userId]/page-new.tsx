'use client'

import { useParams } from 'next/navigation'
import { useWorkspaceUsers } from '@/hooks/use-workspace-users'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useSpecificDMNew } from '@/hooks/use-direct-messages-new'
import DMChatNew from '@/components/slack/dm-chat-new'
import { UserAvatar } from '@/components/slack/user-avatar'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { MockUserDebug } from '@/components/debug/mock-user-debug'

export default function DirectMessagePageNew() {
  const params = useParams()
  const router = useRouter()
  const { workspaceId, userId } = params
  const { user: currentUser } = useAuthContext()
  
  const { users } = useWorkspaceUsers(workspaceId as string)
  const targetUser = users.find(u => u.id === userId)
  
  // Obter ou criar DM entre usuário atual e usuário alvo
  const {
    dm,
    isLoadingDM,
    dmError
  } = useSpecificDMNew(
    currentUser?.id || '',
    userId as string
  )

  const handleBackClick = () => {
    router.push(`/w/${workspaceId}`)
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Usuário não autenticado</h2>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para enviar mensagens.</p>
          <Button onClick={handleBackClick} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
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

  if (isLoadingDM) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparando conversa...</span>
        </div>
      </div>
    )
  }

  if (dmError || !dm) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Erro ao criar conversa</h2>
          <p className="text-muted-foreground mb-4">Não foi possível iniciar a conversa com este usuário.</p>
          <Button onClick={handleBackClick} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Debug Component - Only in development */}
      {process.env.NODE_ENV === 'development' && <MockUserDebug />}
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
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
            {targetUser.display_name || targetUser.username || 'Usuário'}
          </h1>
          <p className="text-sm text-muted-foreground">Mensagem direta</p>
        </div>
      </div>

      {/* Chat */}
      <DMChatNew 
        dmId={dm.id}
        otherUserId={targetUser.id}
        otherUser={targetUser}
        workspaceId={workspaceId as string}
      />
    </div>
  )
}
