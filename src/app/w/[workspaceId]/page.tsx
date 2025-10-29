'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useWorkspaceChannels } from '@/hooks';
import { useWorkspaceUsers } from '@/hooks/use-workspace-users';
import { CreateChannelDialog } from '@/components/slack/create-channel-dialog';
import WorkspaceSidebar from '@/components/slack/workspace-sidebar';
import ChannelPage from '@/components/slack/channel-page';
import DMPage from '@/components/slack/dm-page';
import RightPane from '@/components/slack/right-pane';
import { ConversationsView } from '@/components/slack/conversations-view';
import { ActivityView } from '@/components/slack/activity-view';
import { PeopleView } from '@/components/slack/people-view';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SidebarView = 'home' | 'conversations' | 'activity' | 'people';

interface SidebarContextType {
  activeView: SidebarView;
  setActiveView: (view: SidebarView) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}

export default function WorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const selectedChannelId = searchParams.get('channel');
  const selectedDMUserId = searchParams.get('dm');
  
  const [activeView, setActiveView] = useState<SidebarView>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { channels, isLoading, error } = useWorkspaceChannels(workspaceId);
  const { users } = useWorkspaceUsers(workspaceId);

  // ✅ MOBILE: Fechar menu quando navegar
  useEffect(() => {
    if (selectedChannelId || selectedDMUserId) {
      setIsMobileMenuOpen(false);
    }
  }, [selectedChannelId, selectedDMUserId]);

  const handleChannelClick = (channelId: string) => {
    // Reset to home view when clicking on a channel
    setActiveView('home');
    // Navigate to channel using Next.js router
    router.push(`/w/${workspaceId}?channel=${channelId}`);
    // Fechar menu mobile
    setIsMobileMenuOpen(false);
  };

  const handleUserClick = (userId: string) => {
    // Reset to home view when clicking on a user
    setActiveView('home');
    // Navigate to DM using Next.js router
    router.push(`/w/${workspaceId}?dm=${userId}`);
    // Fechar menu mobile
    setIsMobileMenuOpen(false);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'conversations':
        return (
          <ConversationsView
            workspaceId={workspaceId}
            channels={channels}
            directMessages={[]} // TODO: Get from hook
            users={users}
            onChannelClick={handleChannelClick}
            onUserClick={handleUserClick}
          />
        );
      
      case 'activity':
        return (
          <ActivityView
            workspaceId={workspaceId}
            channels={channels}
            directMessages={[]} // TODO: Get from hook
            users={users}
            onChannelClick={handleChannelClick}
            onUserClick={handleUserClick}
          />
        );

      case 'people':
        return (
          <PeopleView
            workspaceId={workspaceId}
            users={users}
            onUserClick={handleUserClick}
          />
        );
      
      case 'home':
      default:
        if (selectedChannelId) {
          return (
            <ChannelPage 
              workspaceId={workspaceId} 
              channelId={selectedChannelId}
              channels={channels}
            />
          );
        } else if (selectedDMUserId) {
          return (
            <DMPage 
              workspaceId={workspaceId} 
              userId={selectedDMUserId}
              users={users}
            />
          );
        } else {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Selecione um canal ou conversa</h2>
                <p className="text-muted-foreground">Escolha um canal ou conversa direta na barra lateral para começar a conversar.</p>
                {channels.length === 0 && (
                  <div className="mt-4">
                    <CreateChannelDialog workspaceId={workspaceId} />
                  </div>
                )}
              </div>
            </div>
          );
        }
    }
  };

  return (
    <SidebarContext.Provider value={{ activeView, setActiveView }}>
      <div className="flex h-screen bg-background w-full relative">
        
        {/* ✅ MOBILE: Overlay escuro quando menu está aberto */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Left Sidebar - Workspace Navigation */}
        <div className={cn(
          "flex-shrink-0 transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0",
          // Mobile: mostrar como overlay quando aberto
          isMobileMenuOpen 
            ? "fixed left-0 top-0 bottom-0 z-50 translate-x-0"
            : "fixed left-0 top-0 bottom-0 z-50 -translate-x-full md:translate-x-0"
        )}>
          <WorkspaceSidebar workspaceId={workspaceId} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full md:w-auto">
          {/* ✅ MOBILE: Botão hamburger para abrir menu */}
          <div className="md:hidden flex items-center gap-2 p-2 border-b bg-background sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            {selectedChannelId || selectedDMUserId ? (
              <h1 className="text-base font-semibold truncate flex-1">
                {selectedChannelId 
                  ? `#${channels.find(c => c.id === selectedChannelId)?.name || 'Canal'}`
                  : users.find(u => u.id === selectedDMUserId)?.display_name || 'Conversa'}
              </h1>
            ) : (
              <h1 className="text-base font-semibold">Workspace</h1>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {renderMainContent()}
          </div>
        </div>
        
        {/* Right Pane for Threads - Hidden on mobile */}
        {(selectedChannelId || selectedDMUserId) && activeView === 'home' ? (
          <div className="hidden lg:block flex-shrink-0">
            <RightPane 
              conversation={selectedChannelId ? {
                id: selectedChannelId,
                workspaceId: workspaceId,
                name: channels.find(c => c.id === selectedChannelId)?.name || 'Channel',
                description: '',
                isPrivate: false,
                unreadCount: 0,
                members: []
              } : selectedDMUserId ? {
                id: selectedDMUserId,
                workspaceId: workspaceId,
                name: users.find(u => u.id === selectedDMUserId)?.display_name || 'DM',
                description: '',
                isPrivate: true,
                unreadCount: 0,
                members: []
              } : undefined}
              users={users}
            />
          </div>
        ) : null}
      </div>
    </SidebarContext.Provider>
  );
}