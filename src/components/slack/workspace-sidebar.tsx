'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSidebarContext } from '@/app/w/[workspaceId]/page';
import { 
  Plus, 
  Hash, 
  MessageCircle, 
  Settings, 
  Users, 
  Bell, 
  Home,
  ChevronDown,
  ChevronRight,
  Lock,
  Rocket,
  UserPlus,
  LogOut,
  User,
  Moon,
  Clock,
  Shield,
  ChevronsUpDown,
  Edit,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvitePeopleDialog } from './invite-people-dialog';
import { EditWorkspaceDialog } from './edit-workspace-dialog';

import { UserAvatar } from './user-avatar';
import { CreateChannelDialog } from './create-channel-dialog';
import { NewDMDialog } from './new-dm-dialog';
import { ChannelManagement } from './channel-management';
import { useWorkspaceChannels } from '@/hooks/use-channels';
import { useWorkspaceUsersAdmin } from '@/hooks/use-workspace-users-admin';
import { useUserLevels } from '@/hooks/use-user-levels';
import { useDirectMessages } from '@/hooks/use-direct-messages';
import { useUnreadCounts } from '@/hooks/use-unread-counts';
import { useWorkspace } from '@/hooks/use-workspaces';
import { cn } from '@/lib/utils';

interface WorkspaceSidebarProps {
  workspaceId: string;
}

export default function WorkspaceSidebar({ workspaceId }: WorkspaceSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // ✅ CORRIGIDO: Obter channelId tanto de path params quanto de query params
  const currentChannelId = params.channelId as string || searchParams.get('channel');
  const currentUserId = params.userId as string || searchParams.get('dm');
  
  // ✅ DEBUG: Log dos parâmetros para entender a inconsistência
  console.log('🔍 WorkspaceSidebar: params:', params);
  console.log('🔍 WorkspaceSidebar: searchParams:', searchParams.toString());
  console.log('🔍 WorkspaceSidebar: currentChannelId (path):', params.channelId);
  console.log('🔍 WorkspaceSidebar: currentChannelId (query):', searchParams.get('channel'));
  console.log('🔍 WorkspaceSidebar: currentChannelId (final):', currentChannelId);
  console.log('🔍 WorkspaceSidebar: currentUserId (path):', params.userId);
  console.log('🔍 WorkspaceSidebar: currentUserId (query):', searchParams.get('dm'));
  console.log('🔍 WorkspaceSidebar: currentUserId (final):', currentUserId);
  const [isNewDMDialogOpen, setIsNewDMDialogOpen] = useState(false);
  const [isInvitePeopleDialogOpen, setIsInvitePeopleDialogOpen] = useState(false);
  const [isEditWorkspaceDialogOpen, setIsEditWorkspaceDialogOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'active' | 'away'>('active');
  const [isDirectMessagesExpanded, setIsDirectMessagesExpanded] = useState(false);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  // ✅ CORRIGIDO: Usar hook useWorkspace para carregar dados reais
  const { workspace, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { activeView, setActiveView } = useSidebarContext();
  
  // Don't render if no workspaceId
  if (!workspaceId) {
    return null;
  }
  

  
  // State for collapsible sections (removed - no longer needed)
  
  // Fetch channels and users
  const { channels = [], isLoading: channelsLoading, error: channelsError } = useWorkspaceChannels(workspaceId);
  

  const { data: users = [], isLoading: usersLoading, error: usersError } = useWorkspaceUsersAdmin(workspaceId);
  const { currentUserLevel } = useUserLevels(workspaceId);
  const { directMessages, isLoading: dmsLoading } = useDirectMessages(workspaceId);
  const { getUnreadCount, getTotalUnreadCount } = useUnreadCounts(workspaceId);

  const handleChannelClick = (channelId: string) => {
    // Reset to home view when clicking on a channel
    setActiveView('home');
    // Navigate to channel using Next.js router (same as in WorkspacePage)
    router.push(`/w/${workspaceId}?channel=${channelId}`);
  };

  const handleUserClick = (userId: string) => {
    // Reset to home view when clicking on a user
    setActiveView('home');
    // Navigate to DM using Next.js router (same as in WorkspacePage)
    router.push(`/w/${workspaceId}?dm=${userId}`);
  };

  const handleClearStatus = () => {
    setUserStatus('active');
  };

  const handleSetAway = () => {
    setUserStatus('away');
  };

  const handleLogout = () => {
    router.push('/auth/login');
  };

  const handleHomeClick = () => {
    setActiveView('home');
    router.push(`/w/${workspaceId}`);
  };

  const handleConversationsClick = () => {
    setActiveView('conversations');
  };

  const handleActivityClick = () => {
    setActiveView('activity');
  };

  const handlePeopleClick = () => {
    setActiveView('people');
  };

  const handleWorkspaceSettings = () => {
    // Navegar para configurações do workspace
    router.push(`/w/${workspaceId}/settings`);
  };

  const handleInvitePeople = () => {
    setIsInvitePeopleDialogOpen(true);
  };

  const handleCreateWorkspace = () => {
    // Navegar para criar novo workspace
    router.push('/w');
  };

  const handleEditWorkspace = () => {
    setIsEditWorkspaceDialogOpen(true);
  };

  const handleWorkspaceUpdate = (updatedData: { name: string; description: string; isActive: boolean }) => {
    // ✅ CORRIGIDO: Não usar mais estado local, apenas invalidar cache
    // O hook useWorkspace irá recarregar os dados automaticamente
    console.log('Workspace updated:', updatedData);
  };

  return (
    <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Workspace Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-sidebar-accent/50 rounded-md p-1 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  WE
                </div>
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-semibold text-sidebar-foreground">{workspace?.name || 'Workspace'}</h2>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  WE
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{workspace?.name || 'Workspace'}</p>
                  <p className="text-xs text-muted-foreground truncate">Workspace ativo</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleWorkspaceSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações do workspace</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleInvitePeople}>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Convidar pessoas</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditWorkspace}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar workspace</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateWorkspace}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Criar novo workspace</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/w')}>
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                <span>Todos os workspaces</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Main Navigation */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeView === 'home' && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
            onClick={handleHomeClick}
          >
            <Home className="h-4 w-4 mr-3" />
            Início
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeView === 'conversations' && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
            onClick={handleConversationsClick}
          >
            <MessageCircle className="h-4 w-4 mr-3" />
            Conversas
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeView === 'activity' && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
            onClick={handleActivityClick}
          >
            <Bell className="h-4 w-4 mr-3" />
            Atividade
          </Button>

          <Separator className="my-2 bg-sidebar-border" />

          {/* Direct Messages */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 mr-1 transition-transform duration-200 cursor-pointer",
                    isDirectMessagesExpanded && "rotate-90"
                  )}
                  onClick={() => setIsDirectMessagesExpanded(!isDirectMessagesExpanded)}
                />
                <MessageCircle className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium text-sidebar-foreground">Mensagens diretas</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  onClick={() => setIsNewDMDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {getTotalUnreadCount() > 0 && (
                  <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {getTotalUnreadCount()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Direct Messages List - Always visible for users with conversations */}
            {directMessages.length > 0 && (
              <div className="pl-6 space-y-1 mt-2">
                {dmsLoading ? (
                  <div className="text-xs text-sidebar-foreground/60 py-2">
                    Carregando conversas...
                  </div>
                ) : (
                  <>
                    {/* Show count only when expanded */}
                    {isDirectMessagesExpanded && (
                      <div className="text-xs text-sidebar-foreground/60 py-1">
                        {directMessages.length} conversa{directMessages.length !== 1 ? 's' : ''} direta{directMessages.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {directMessages.map((dm) => {
                      const user = users.find(u => u.id === dm.userId);
                      if (!user) return null;
                      
                      const conversationId = `dm-${dm.userId}`;
                      const unreadCount = getUnreadCount(conversationId);
                      
                      return (
                        <button
                          key={dm.id}
                          onClick={() => handleUserClick(dm.userId)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ease-in-out",
                            currentUserId === dm.userId
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar user={user} className="h-5 w-5" />
                            <span className="truncate">{user.displayName}</span>
                            {unreadCount > 0 && (
                              <div className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadCount}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
            
            {/* Show empty state only when expanded and no conversations */}
            {isDirectMessagesExpanded && directMessages.length === 0 && !dmsLoading && (
              <div className="pl-6 space-y-1 mt-2">
                <div className="text-xs text-sidebar-foreground/60 py-2">
                  Nenhuma conversa direta
                </div>
              </div>
            )}
          </div>

          <Separator className="my-2 bg-sidebar-border" />

          {/* Channels */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
                className="flex items-center flex-1 hover:bg-sidebar-accent/50 rounded-md px-2 py-1 transition-colors"
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 mr-1 transition-transform duration-200",
                    isChannelsExpanded && "rotate-90"
                  )} 
                />
                <Hash className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium text-sidebar-foreground">Canais</span>
              </button>
              <CreateChannelDialog workspaceId={workspaceId} />
            </div>
            
            {/* Expanded Channels List */}
            {isChannelsExpanded && (
              <div className="pl-6 space-y-1 mt-2">
              {channelsLoading ? (
                <div className="text-xs text-sidebar-foreground/60 py-2">
                  Carregando canais...
                </div>
              ) : channelsError ? (
                <div className="text-xs text-red-400 py-2">
                  Erro ao carregar canais: {channelsError?.message || 'Erro desconhecido'}
                </div>
              ) : channels.length === 0 ? (
                <div className="text-xs text-sidebar-foreground/60 py-2">
                  Nenhum canal encontrado
                </div>
              ) : (
                <>
                  <div className="text-xs text-sidebar-foreground/60 py-1">
                    {channels.length} canal{channels.length !== 1 ? 's' : ''} encontrado{channels.length !== 1 ? 's' : ''}
                  </div>
                  {channels.map((channel) => {
                    return (
                      <div
                        key={channel.id}
                        className="group flex items-center justify-between"
                      >
                        <button
                          onClick={() => handleChannelClick(channel.id)}
                          className={cn(
                            "flex-1 text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ease-in-out",
                            currentChannelId === channel.id
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {channel.is_private ? (
                              <Lock className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Hash className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{channel.name}</span>
                          </div>
                        </button>
                        <ChannelManagement 
                          channel={channel}
                          workspaceId={workspaceId}
                          onChannelUpdate={() => {
                            // Recarregar canais após atualização
                            window.location.reload();
                          }}
                          onChannelDelete={() => {
                            // Recarregar canais após exclusão
                            window.location.reload();
                          }}
                          className="ml-2"
                        />
                      </div>
                    );
                  })}
                </>
              )}
              </div>
            )}
          </div>

          <Separator className="my-2 bg-sidebar-border" />

          {/* People */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeView === 'people' && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
            onClick={handlePeopleClick}
          >
            <Users className="h-4 w-4 mr-3" />
            Pessoas
          </Button>
          
          {/* User Level Manager Button - Only show if user has permission */}
          {currentUserLevel && (currentUserLevel.userLevel === 'super_admin' || currentUserLevel.userLevel === 'admin') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => {
                // Trigger the UserLevelManager to open
                const event = new CustomEvent('openUserLevelManager');
                window.dispatchEvent(event);
              }}
            >
              <Shield className="h-4 w-4 mr-3" />
              Gerenciar Níveis
            </Button>
          )}

        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-background">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 hover:bg-sidebar-accent/50 rounded-md p-1 transition-colors">
              <div className="relative">
                <UserAvatar 
                  user={{
                    id: currentUserLevel?.id || 'current-user',
                    displayName: currentUserLevel?.displayName || 'Current User',
                    handle: 'currentuser',
                    avatarUrl: currentUserLevel?.avatarUrl || null
                  }} 
                  className="h-8 w-8" 
                />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-background",
                  userStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                )} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                  {currentUserLevel?.displayName || 'Current User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {userStatus === 'active' ? 'Ativo' : 'Ausente'}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 p-3">
              <div className="relative">
                <UserAvatar 
                  user={{
                    id: currentUserLevel?.id || 'current-user',
                    displayName: currentUserLevel?.displayName || 'Current User',
                    handle: 'currentuser',
                    avatarUrl: currentUserLevel?.avatarUrl || null
                  }} 
                  className="h-10 w-10" 
                />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                  userStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUserLevel?.displayName || 'Current User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userStatus === 'active' ? 'Ativo' : 'Ausente'}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearStatus}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Limpar status</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSetAway}>
              <Clock className="mr-2 h-4 w-4" />
              <span>Definir como ausente</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Pausar notificações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/auth/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferências</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair de WE Marketing</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* New DM Dialog */}
      <NewDMDialog
        isOpen={isNewDMDialogOpen}
        onOpenChange={setIsNewDMDialogOpen}
        workspaceId={workspaceId}
        onSelectUser={(userId) => {
          handleUserClick(userId);
          setIsNewDMDialogOpen(false);
        }}
      />

      {/* Invite People Dialog */}
      <InvitePeopleDialog
        isOpen={isInvitePeopleDialogOpen}
        onOpenChange={setIsInvitePeopleDialogOpen}
        workspaceId={workspaceId}
        workspaceName={workspace?.name || 'Workspace'}
      />
      
      {/* Edit Workspace Dialog */}
      <EditWorkspaceDialog
        isOpen={isEditWorkspaceDialogOpen}
        onOpenChange={setIsEditWorkspaceDialogOpen}
        workspaceId={workspaceId}
        currentWorkspace={workspace}
        onWorkspaceUpdate={handleWorkspaceUpdate}
      />
    </div>
  );
}
