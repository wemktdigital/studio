
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Message, User, Channel } from '@/lib/types';
import MessageItem from './message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Hash } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { useChannelThreads } from '@/hooks/use-threads';

interface MessageListProps {
  messages: Message[];
  users: User[];
  conversation: Channel | User | undefined;
  workspaceId?: string;
}

const DateDivider = ({ date }: { date: Date }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const getLabel = () => {
      // Validate date before using it
      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date passed to DateDivider:', date);
        return 'Invalid Date';
      }
      
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
  // ✅ ATUALIZADO: Usar dados reais dos usuários
  const members: User[] = []; // Será implementado quando tivermos acesso aos usuários do workspace
  
  const creator = members[0];

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

export default function MessageList({ messages, users, conversation, workspaceId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ AUTO-SCROLL: Scroll para a última mensagem quando novas mensagens chegam
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center" data-testid="empty-message-list">
        <div className="rounded-full bg-muted p-4">
          <Hash className="h-8 w-8 text-muted-foreground" />
        </div>
        {conversation && 'name' in conversation ? (
          <EmptyChannelWelcome channel={conversation} />
        ) : (
          <>
            <h3 className="text-lg font-semibold">No messages yet</h3>
            <p className="text-muted-foreground">
              Start the conversation by sending a message!
            </p>
          </>
        )}
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    // Validate and handle invalid dates
    let date: Date;
    try {
      date = new Date(message.createdAt);
      // Check if date is valid
      if (isNaN(date.getTime()) || !message.createdAt) {
        console.warn('Invalid date for message:', message.id, 'createdAt:', message.createdAt);
        date = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn('Error parsing date for message:', message.id, 'createdAt:', message.createdAt, error);
      date = new Date(); // Fallback to current date
    }
    
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 h-full">
        <div className="p-4 space-y-4">
          {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              <DateDivider date={new Date(dateKey)} />
              <div className="space-y-4">
                {dateMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    users={users}
                    conversation={conversation}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* ✅ AUTO-SCROLL: Referência para scroll automático */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
