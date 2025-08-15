import React from 'react';
import { getMockData } from '@/lib/data';
import MainLayout from '@/components/slack/main-layout';

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string; channelId?: string; userId?: string };
}) {
  // TODO: Replace with real data fetching from Firestore
  const { workspaces, users, currentWorkspace, channels, dms } = getMockData(params);

  if (!currentWorkspace) {
    return <div>Workspace not found.</div>;
  }

  return (
    <MainLayout
      workspaces={workspaces}
      users={users}
      currentWorkspace={currentWorkspace}
      channels={channels}
      dms={dms}
      currentConversation={undefined} // This will be provided by child pages
      messages={[]} // This will be provided by child pages
      params={params}
    >
      {children}
    </MainLayout>
  );
}
