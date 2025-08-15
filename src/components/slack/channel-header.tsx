'use client';

import React from 'react';
import { Hash, User, Info, Search, Phone, Star } from 'lucide-react';
import { Channel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { Separator } from '@/components/ui/separator';

interface ChannelHeaderProps {
  conversation: Channel | User | undefined;
}

export default function ChannelHeader({ conversation }: ChannelHeaderProps) {
  if (!conversation) {
    return <div className="flex h-16 shrink-0 items-center border-b px-6">Loading...</div>; // Or a skeleton loader
  }

  const isChannel = 'isPrivate' in conversation;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6" data-testid="channel-header">
      <div className="flex items-center gap-3">
        {isChannel ? (
          <Hash className="h-6 w-6 text-muted-foreground" />
        ) : (
          <UserAvatar user={conversation} className="h-8 w-8" />
        )}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold">{isChannel ? conversation.name : conversation.displayName}</h2>
          {isChannel && conversation.description && (
            <p className="text-xs text-muted-foreground">{conversation.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isChannel && (
          <div className="flex -space-x-2 overflow-hidden">
            {/* Mock members */}
            <UserAvatar user={{id:'2', displayName: 'Bob', handle: 'bob', avatarUrl: 'https://i.pravatar.cc/40?u=bob', status: 'offline'}} className="h-7 w-7 border-2 border-background" />
            <UserAvatar user={{id:'3', displayName: 'Charlie', handle: 'charlie', avatarUrl: 'https://i.pravatar.cc/40?u=charlie', status: 'away'}} className="h-7 w-7 border-2 border-background" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
              +4
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" aria-label="Start a call">
          <Phone className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon" aria-label="Search in conversation">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="View pinned messages">
          <Star className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="View conversation details">
          <Info className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
