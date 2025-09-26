'use client';

import React, { ReactNode, useEffect } from 'react'
import { useParams } from 'next/navigation'


import WorkspaceSidebar from './workspace-sidebar'


import { NotificationPermissionBanner } from './notification-permission-banner'

import { UserLevelManager } from './user-level-manager'
// import { LocalDataDebugger } from '../debug/local-data-debugger'

interface MainLayoutProps {
  children: ReactNode
  workspaceId?: string
  channelId?: string
}

export default function MainLayout({ children, workspaceId, channelId }: MainLayoutProps) {
  const params = useParams();
  const actualWorkspaceId = workspaceId || params.workspaceId as string;
  const actualChannelId = channelId || params.channelId as string;
  
  // Memoize the workspaceId to prevent unnecessary re-renders
  const memoizedWorkspaceId = React.useMemo(() => actualWorkspaceId, [actualWorkspaceId]);
  

  

  


  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />

      {/* User Level Manager */}
      <UserLevelManager workspaceId={actualWorkspaceId} />
      
      {/* Debug Component */}
      {/* <LocalDataDebugger /> */}
    </div>
  )
}
