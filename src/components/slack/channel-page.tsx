'use client'

import { useChannel } from '@/hooks/use-channels'
import FunctionalChat from '@/components/slack/functional-chat'
import { Channel } from '@/lib/types'

interface ChannelPageProps {
  workspaceId: string
  channelId: string
  channels: Channel[]
}

export default function ChannelPage({ workspaceId, channelId, channels }: ChannelPageProps) {
  const { channel, isLoading, error } = useChannel(channelId)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando canal...</p>
        </div>
      </div>
    )
  }

  if (error || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Erro ao carregar canal: {error?.message || 'Canal não encontrado'}</p>
          <p className="text-sm mt-2">ID do Canal: {channelId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full">
      <FunctionalChat 
        channelId={channelId} 
        channelName={channel.name || 'Canal'} 
        workspaceId={workspaceId}
      />
    </div>
  )
}
