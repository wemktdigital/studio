
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronsUpDown, Dot, Hash, Lock, Plus, Search, MessageSquare, AtSign, Braces } from 'lucide-react';

import { Workspace, Channel, DirectMessage, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from './dark-mode-toggle';
import { UserAvatar } from './user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddChannelDialog } from './add-channel-dialog';
import { GlobalSearchDialog } from './global-search-dialog';
import { NewDmDialog } from './new-dm-dialog';

interface ChannelSidebarProps {
  workspace: Workspace;
  channels: Channel[];
  dms: DirectMessage[];
  users: User[];
  params: { workspaceId: string; channelId?: string; userId?: string };
}

export default function ChannelSidebar({
  workspace,
  channels,
  dms,
  users,
  params,
}: ChannelSidebarProps) {
  const currentUser = users.find(u => u.id === '1'); // Mock current user
  const [isAddChannelOpen, setAddChannelOpen] = useState(false);
  const [isNewDmOpen, setNewDmOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);


  const handleAddChannel = (data: { name: string; description?: string; isPrivate: boolean }) => {
    // TODO: Implement actual channel creation logic
    console.log('Creating channel:', data);
    setAddChannelOpen(false);
  };

  const handleNewDm = (userId: string) => {
    // TODO: Implement actual DM creation and navigation
    console.log('Starting DM with user:', userId);
    setNewDmOpen(false);
  }

  return (
    <>
      <AddChannelDialog
        isOpen={isAddChannelOpen}
        onOpenChange={setAddChannelOpen}
        onSubmit={handleAddChannel}
      />
      <GlobalSearchDialog
        isOpen={isSearchOpen}
        onOpenChange={setSearchOpen}
      />
      <NewDmDialog
        isOpen={isNewDmOpen}
        onOpenChange={setNewDmOpen}
        users={users.filter(u => u.id !== currentUser?.id)}
        onSelectUser={handleNewDm}
      />
      <div
        className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground"
        data-testid="channel-sidebar"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between p-4 shadow-sm transition-colors hover:bg-sidebar-accent border-b border-sidebar-border">
              <h1 className="text-xl font-bold text-sidebar-accent-foreground">{workspace.name}</h1>
              <ChevronsUpDown className="h-5 w-5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
            <DropdownMenuItem>Invite People</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Create a new Workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-4 py-4">
            <div className='px-2'>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            <SidebarNav>
              <SidebarNavItem icon={MessageSquare} label="Threads" href={`/w/${params.workspaceId}/threads`} />
              <SidebarNavItem icon={AtSign} label="Mentions" href={`/w/${params.workspaceId}/mentions`} />
              <SidebarNavItem icon={Braces} label="Drafts" href={`/w/${params.workspaceId}/drafts`} />
            </SidebarNav>

            <Collapsible defaultOpen>
              <div className="flex w-full items-center justify-between px-2 text-sm font-bold text-sidebar-foreground/80 hover:text-sidebar-foreground">
                <CollapsibleTrigger asChild>
                    <button className="flex flex-1 cursor-pointer items-center gap-1">
                        <ChevronDown className="h-4 w-4" />
                        <span>Channels</span>
                    </button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddChannelOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CollapsibleContent className="mt-2 flex flex-col gap-1">
                {channels.map((channel) => (
                  <SidebarLink
                    key={channel.id}
                    href={`/w/${params.workspaceId}/c/${channel.id}`}
                    label={channel.name}
                    icon={channel.isPrivate ? Lock : Hash}
                    isActive={params.channelId === channel.id}
                    isUnread={channel.unreadCount > 0}
                    badgeCount={channel.unreadCount}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <div className="flex w-full items-center justify-between px-2 text-sm font-bold text-sidebar-foreground/80 hover:text-sidebar-foreground">
                <CollapsibleTrigger asChild>
                  <button className="flex flex-1 cursor-pointer items-center gap-1">
                    <ChevronDown className="h-4 w-4" />
                    <span>Direct Messages</span>
                  </button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNewDmOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CollapsibleContent className="mt-2 flex flex-col gap-1">
                {dms.map((dm) => {
                  const user = users.find((u) => u.id === dm.userId);
                  if (!user) return null;
                  return (
                    <SidebarLink
                      key={dm.id}
                      href={`/w/${params.workspaceId}/dm/${dm.userId}`}
                      label={user.displayName}
                      icon={<UserAvatar user={user} className="h-5 w-5" />}
                      isActive={params.userId === dm.userId}
                      isUnread={dm.unreadCount > 0}
                      badgeCount={dm.unreadCount}
                    />
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between border-t border-sidebar-border p-2">
          {currentUser && <UserAvatar user={currentUser} showName />}
          <DarkModeToggle />
        </div>
      </div>
    </>
  );
}

const SidebarNav = ({ children }: { children: React.ReactNode }) => (
  <nav className="flex flex-col gap-1">{children}</nav>
);

const SidebarNavItem = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) => (
    <Link
        href={href}
        className="flex items-center gap-3 rounded-md px-2 py-1.5 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </Link>
);

const SidebarLink = ({ href, label, icon: Icon, isActive, isUnread, badgeCount }: {
  href: string;
  label: string;
  icon: React.ElementType | React.ReactNode;
  isActive: boolean;
  isUnread: boolean;
  badgeCount: number;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1 text-base',
        isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isUnread && !isActive && 'font-bold text-sidebar-accent-foreground'
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {React.isValidElement(Icon) ? Icon : <Icon className="h-4 w-4 opacity-70" />}
        <span className="truncate">{label}</span>
      </div>
      {badgeCount > 0 && (
        <span className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
          isActive ? 'bg-sidebar-primary-foreground text-sidebar-primary' : 'bg-destructive text-destructive-foreground'
        )}>
          {badgeCount}
        </span>
      )}
    </Link>
  );
};
