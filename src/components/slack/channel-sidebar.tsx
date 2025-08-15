'use client';

import React from 'react';
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

  return (
    <div
      className="flex h-full w-72 flex-col bg-muted/80 text-foreground"
      data-testid="channel-sidebar"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 shadow-sm transition-colors hover:bg-muted">
            <h1 className="text-xl font-bold">{workspace.name}</h1>
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
          <SidebarNav>
            <SidebarNavItem icon={MessageSquare} label="Threads" href={`/w/${params.workspaceId}/threads`} />
            <SidebarNavItem icon={AtSign} label="Mentions" href={`/w/${params.workspaceId}/mentions`} />
            <SidebarNavItem icon={Braces} label="Drafts" href={`/w/${params.workspaceId}/drafts`} />
          </SidebarNav>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-1">
                <ChevronDown className="h-4 w-4" />
                <span>Channels</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
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
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-1">
                <ChevronDown className="h-4 w-4" />
                <span>Direct Messages</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
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

      <div className="flex items-center justify-between border-t p-2">
        {currentUser && <UserAvatar user={currentUser} showName />}
        <DarkModeToggle />
      </div>
    </div>
  );
}

const SidebarNav = ({ children }: { children: React.ReactNode }) => (
  <nav className="flex flex-col gap-1">{children}</nav>
);

const SidebarNavItem = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) => (
    <Link
        href={href}
        className="flex items-center gap-3 rounded-md px-2 py-1.5 text-base text-muted-foreground hover:bg-primary/10 hover:text-foreground"
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </Link>
);

const SidebarLink = ({ href, label, icon: IconOrComp, isActive, isUnread, badgeCount }: {
  href: string;
  label: string;
  icon: React.ReactNode | React.ElementType;
  isActive: boolean;
  isUnread: boolean;
  badgeCount: number;
}) => {
  const Icon = typeof IconOrComp === 'function' ? <IconOrComp className="h-4 w-4 opacity-70" /> : IconOrComp;

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1 text-base',
        isActive ? 'bg-primary/80 text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
        isUnread && !isActive && 'font-bold text-foreground'
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {Icon}
        <span className="truncate">{label}</span>
      </div>
      {badgeCount > 0 && (
        <span className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
          isActive ? 'bg-primary-foreground text-primary' : 'bg-destructive text-destructive-foreground'
        )}>
          {badgeCount}
        </span>
      )}
    </Link>
  );
};
