'use client'

import { useParams } from 'next/navigation'
import { useWorkspaceUsers } from '@/hooks/use-workspace-users'
import { useAuthContext } from '@/components/providers/auth-provider'
import DMChatSimple from '@/components/slack/dm-chat-simple'
import { UserAvatar } from '@/components/slack/user-avatar'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DirectMessagePage() {
  const params = useParams()
  const router = useRouter()
  const { workspaceId, userId } = params
  const { user: currentUser } = useAuthContext()
  
  const { users } = useWorkspaceUsers(workspaceId as string)
  const targetUser = users.find(u => u.id === userId)
  
  const handleBackClick = () => {
    router.push(`/w/${workspaceId}`)
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
    <div className="flex-1 flex flex-col h-full">
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
            {targetUser.user_metadata?.display_name || targetUser.email || 'Usuário'}
          </h1>
          <p className="text-sm text-muted-foreground">Mensagem direta</p>
        </div>
      </div>

      {/* Messages and Composer */}
      <DMChatSimple 
        dmId={`dm-${userId}`}
        userId={userId as string}
        workspaceId={workspaceId as string}
      />
    </div>
  )
}
