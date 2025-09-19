'use client'

import React from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import MainLayout from '@/components/slack/main-layout';

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string; channelId?: string; userId?: string };
}) {
  return (
    <AuthGuard>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
