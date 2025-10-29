'use client';

import React, { useCallback, useState } from 'react';
import { Hash, User as UserIcon, Info, Search, Star } from 'lucide-react';
import { Channel, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { Separator } from '@/components/ui/separator';

import ChannelDetailsPane from './channel-details-pane';
import UserDetailsPane from './user-details-pane';
import { SearchDialog } from './search-dialog';
import { useWorkspaceUsers } from '@/hooks/use-workspace-users';

interface ChannelHeaderProps {
  conversation: Channel | User | undefined;
  workspaceId?: string;
}

export default function ChannelHeader({ conversation, workspaceId }: ChannelHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { users: allUsers } = useWorkspaceUsers(workspaceId || '');

  // ✅ DEBUG: Log dos dados recebidos
  console.log('🔍 ChannelHeader: conversation data:', conversation);
  console.log('🔍 ChannelHeader: conversation type:', typeof conversation);
  console.log('🔍 ChannelHeader: conversation keys:', conversation ? Object.keys(conversation) : 'null');

  const handleInfoClick = useCallback(() => {
    // TODO: Implement info panel functionality
    console.log('Info clicked for:', conversation);
  }, [conversation]);

  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  if (!conversation) {
    return <div className="flex h-16 shrink-0 items-center border-b px-6">Loading...</div>; // Or a skeleton loader
  }

  const isChannel = 'isPrivate' in conversation;
  const currentChannelId = isChannel ? (conversation as Channel).id : undefined;

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b px-3 md:px-6" data-testid="channel-header">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {isChannel ? (
            <Hash className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground flex-shrink-0" />
          ) : (
            <UserAvatar user={conversation} className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <h2 className="text-base md:text-lg font-bold truncate">{isChannel ? conversation.name : conversation.displayName}</h2>
            {isChannel && (
              <p className="hidden md:block text-xs text-muted-foreground truncate">
                {conversation.description || `Canal ${conversation.name}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {isChannel && allUsers && allUsers.length > 0 && (
            <div className="hidden md:flex -space-x-2 overflow-hidden">
              {allUsers.slice(0, 2).map(user => (
                <UserAvatar key={user.id} user={user} className="h-7 w-7 border-2 border-background" />
              ))}
              {allUsers.length > 2 &&
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +{allUsers.length - 2}
                  </div>
              }
            </div>
          )}
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          {isChannel && (
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Search messages" 
              onClick={handleSearchClick}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="View conversation details" 
            onClick={handleInfoClick}
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <Info className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </header>

      {/* Search Dialog */}
      {workspaceId && (
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          workspaceId={workspaceId}
          currentChannelId={currentChannelId}
        />
      )}
    </>
  );
}
