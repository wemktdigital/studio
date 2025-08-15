'use client';

import React from 'react';
import WorkspaceSidebar from './workspace-sidebar';
import ChannelSidebar from './channel-sidebar';
import RightPane from './right-pane';
import { Workspace, Channel, DirectMessage, User, Message } from '@/lib/types';
import { RightPaneProvider } from '@/hooks/use-right-pane';

interface MainLayoutProps {
  workspaces: Workspace[];
  users: User[];
  currentWorkspace: Workspace;
  channels: Channel[];
  dms: DirectMessage[];
  currentConversation: Channel | User | undefined;
  messages: Message[];
  children: React.ReactNode;
  params: { workspaceId: string; channelId?: string; userId?: string; };
}

function MainLayoutContent({
  workspaces,
  users,
  currentWorkspace,
  channels,
  dms,
  currentConversation,
  children,
  params,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground" data-testid="main-layout">
      <WorkspaceSidebar workspaces={workspaces} activeWorkspaceId={params.workspaceId} />
      <ChannelSidebar
        workspace={currentWorkspace}
        channels={channels}
        dms={dms}
        users={users}
        params={params}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <RightPane
        conversation={currentConversation}
        users={users}
      />
    </div>
  );
}

export default function MainLayout(props: MainLayoutProps) {
  return (
    <RightPaneProvider>
      <MainLayoutContent {...props} />
    </RightPaneProvider>
  );
}
