
'use client';

import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Message, User, Channel } from '@/lib/types';
import { MessageItem } from './message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Hash } from 'lucide-react';
import { UserAvatar } from './user-avatar';

interface MessageListProps {
  messages: Message[];
  users: User[];
  conversation: Channel | User | undefined;
}

const DateDivider = ({ date }: { date: Date }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const getLabel = () => {
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    };
    setLabel(getLabel());
  }, [date]);
  
  if (!label) {
    return null;
  }

  return (
    <div className="relative py-4" data-testid="date-divider">
      <Separator />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold">
          {label}
        </span>
      </div>
    </div>
  );
};

const EmptyChannelWelcome = ({ channel }: { channel: Channel }) => {
  // TODO: Fetch actual members for the channel instead of mock users
  const members = channel.members.map(id => ({ id, displayName: `User ${id}`, handle: `user${id}`, avatarUrl: `https://i.pravatar.cc/40?u=${id}`, status: 'online' as const }));
  const creator = members[0]; // Assume first member is creator for mock purposes

  return (
    <div className="flex h-full flex-1 flex-col p-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <Hash className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Welcome to #{channel.name}</h2>
          <p className="text-muted-foreground">This is the start of the #{channel.name} channel.</p>
        </div>
      </div>
      <div className='py-4'>
        {channel.description && (
          <p className="text-sm pb-4 border-b">
            <span className='font-bold'>Channel description:</span> {channel.description}
          </p>
        )}
      </div>
      {creator && (
         <div className='text-sm text-muted-foreground flex items-center gap-2 pt-2'>
            <UserAvatar user={creator} className='h-8 w-8'/>
            <p><span className='font-bold text-foreground'>{creator.displayName}</span> created this channel on {format(new Date(), 'MMMM d, yyyy')}.</p>
         </div>
      )}
    </div>
  )
}


export default function MessageList({ messages, users, conversation }: MessageListProps) {
  if (messages.length === 0) {
    if (conversation && 'isPrivate' in conversation) {
       // TODO: Replace with real data fetching. The conversation object should already be passed down.
      return <EmptyChannelWelcome channel={conversation} />;
    }
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center" data-testid="empty-message-list">
        <div className="rounded-full bg-muted p-4">
          <Hash className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">No messages yet</h3>
        <p className="text-muted-foreground">
          Send a message to start the conversation.
        </p>
      </div>
    );
  }

  const messageGroups: React.ReactNode[] = [];
  let lastDate: Date | null = null;

  messages.forEach((message, index) => {
    const currentDate = new Date(message.createdAt);
    if (!lastDate || !isSameDay(currentDate, lastDate)) {
      messageGroups.push(<DateDivider key={`divider-${message.id}`} date={currentDate} />);
    }

    const previousMessage = messages[index - 1];
    const nextMessage = messages[index + 1];
    // TODO: The `users` array should be a map for efficient lookups.
    const author = users.find(u => u.id === message.authorId);

    const isFirstInGroup = !previousMessage || previousMessage.authorId !== message.authorId || !isSameDay(new Date(previousMessage.createdAt), currentDate);
    const isLastInGroup = !nextMessage || nextMessage.authorId !== message.authorId || !isSameDay(new Date(nextMessage.createdAt), currentDate);
    
    if (author) {
      messageGroups.push(
        <MessageItem
          key={message.id}
          message={message}
          author={author}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
        />
      );
    }
    lastDate = currentDate;
  });

  return (
    <ScrollArea className="h-full flex-1" data-testid="message-list">
      <div className="px-6 py-4">
        {messageGroups}
      </div>
    </ScrollArea>
  );
}
