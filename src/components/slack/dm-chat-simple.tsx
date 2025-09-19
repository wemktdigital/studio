'use client'

import React from 'react'
import DMMessageListSimple from './dm-message-list-simple'
import DMMessageComposerSimple from './dm-message-composer-simple'

interface DMChatSimpleProps {
  dmId: string
  userId: string
  workspaceId: string
}

export default function DMChatSimple({ dmId, userId, workspaceId }: DMChatSimpleProps) {
  console.log('🚨🚨🚨 DMChatSimple: RENDERING! 🚨🚨🚨', { 
    dmId,
    userId,
    workspaceId,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-hidden">
        <DMMessageListSimple 
          dmId={dmId}
          userId={userId}
          workspaceId={workspaceId}
        />
      </div>

      {/* Message Composer */}
      <DMMessageComposerSimple 
        dmId={dmId}
        userId={userId}
        workspaceId={workspaceId}
      />
    </div>
  )
}
