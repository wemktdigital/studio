
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Hash, MessageSquare, User as UserIcon } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { users } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function GlobalSearchDialog({ isOpen, onOpenChange }: GlobalSearchDialogProps) {
  // Mock data for demonstration
  const mockResults = {
    channels: [
      { id: '1', name: 'general' },
      { id: '2', name: 'design-system' },
    ],
    messages: [
      { id: '1', text: 'Welcome to the team!', channel: 'general', author: users.find(u => u.id === '1') },
      { id: '3', text: 'Here is the new design mockup.', channel: 'design-system', author: users.find(u => u.id === '1') },
    ],
    users: [
      users.find(u => u.id === '2'),
      users.find(u => u.id === '3'),
    ],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for channels, messages, and users..."
              className="pl-10 text-lg border-0 focus-visible:ring-0 shadow-none"
            />
          </div>
        </DialogHeader>
        <ScrollArea className="h-[50vh]">
            <div className="p-4 space-y-4">
            <SearchResultCategory title="Channels" icon={<Hash className="h-4 w-4"/>}>
                {mockResults.channels.map(channel => (
                    <div key={channel.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                        <Hash className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">{channel.name}</span>
                    </div>
                ))}
            </SearchResultCategory>

            <SearchResultCategory title="Messages" icon={<MessageSquare className="h-4 w-4"/>}>
                {mockResults.messages.map(message => message.author && (
                    <div key={message.id} className="p-2 rounded-md hover:bg-muted cursor-pointer">
                        <div className="flex items-center gap-3">
                            <UserAvatar user={message.author} className="h-8 w-8" />
                            <div className="flex flex-col">
                                <div className='flex items-baseline gap-2'>
                                    <span className="font-bold">{message.author.displayName}</span>
                                    <span className="text-xs text-muted-foreground">in #{message.channel}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{message.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </SearchResultCategory>

            <SearchResultCategory title="Users" icon={<UserIcon className="h-4 w-4"/>}>
                {mockResults.users.map(user => user && (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                        <UserAvatar user={user} className="h-8 w-8" />
                         <div className="flex flex-col">
                            <span className="font-medium">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground">@{user.handle}</span>
                        </div>
                    </div>
                ))}
            </SearchResultCategory>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


const SearchResultCategory = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-2 flex items-center gap-2">{icon} {title}</h4>
        <div className="space-y-1">
            {children}
        </div>
    </div>
)
