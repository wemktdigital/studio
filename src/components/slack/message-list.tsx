'use client';

import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Message, User } from '@/lib/types';
import { MessageItem } from './message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Hash } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  users: User[];
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
    // Render nothing or a placeholder on the server
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


export default function MessageList({ messages, users }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center" data-testid="empty-message-list">
        <div className="rounded-full bg-muted p-4">
          <Hash className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">No messages yet</h3>
        <p className="text-muted-foreground">
          Be the first to say something! Send a message, an emoji, or share a file.
        </p>
        <Button>Send a Message</Button>
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
