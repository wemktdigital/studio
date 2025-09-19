'use client'

import { useParams } from 'next/navigation'
import { useChannel } from '@/hooks/use-channels'
import FunctionalChat from '@/components/slack/functional-chat'

export default function ChannelPage() {
  const params = useParams()
  const channelId = params.channelId as string
  const workspaceId = params.workspaceId as string
  
  console.log('🔍 ChannelPage: Params:', params);
  console.log('🔍 ChannelPage: channelId:', channelId);
  console.log('🔍 ChannelPage: workspaceId:', workspaceId);

  const { channel, isLoading, error } = useChannel(channelId)

  console.log('🔍 ChannelPage: useChannel result:', { channel, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading channel...</p>
        </div>
      </div>
    )
  }

  if (error || !channel) {
    console.error('🔍 ChannelPage: Error or no channel:', { error, channel });
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error loading channel: {error?.message || 'Channel not found'}</p>
          <p className="text-sm mt-2">Channel ID: {channelId}</p>
        </div>
      </div>
    )
  }

  console.log('🔍 ChannelPage: Rendering FunctionalChat with:', {
    channelId,
    channelName: channel.name,
    workspaceId
  });

  return (
    <div className="flex-1 h-full">
      <FunctionalChat 
        channelId={channelId} 
        channelName={channel.name || 'Channel'} 
        workspaceId={workspaceId}
      />
    </div>
  )
}
