import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { MoreHorizontal, Smile, ArrowBigUp, CornerDownRight } from 'lucide-react';
import { Message, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageItemProps {
  message: Message;
  author: User;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageItem({ message, author, isFirstInGroup }: MessageItemProps) {
  const [isClient, setIsClient] = useState(false);
  const timestamp = new Date(message.createdAt);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div
      className="group relative flex gap-4 py-1 pr-10 transition-colors hover:bg-muted/50"
      data-testid="message-item"
    >
      <div className="w-10 shrink-0">
        {isFirstInGroup && <UserAvatar user={author} className="h-10 w-10" />}
      </div>
      <div className="flex-1">
        {isFirstInGroup && (
          <div className="flex items-baseline gap-2">
            <span className="font-bold">{author.displayName}</span>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">
                    {isClient ? format(timestamp, 'h:mm a') : ''}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(timestamp, 'EEEE, MMMM d, yyyy h:mm a')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <MessageContent message={message} />
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-sm transition-colors hover:border-primary"
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute right-4 top-0 -translate-y-1/2 rounded-md border bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><CornerDownRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  switch (message.type) {
    case 'image':
      return (
        <Image
          src={message.attachment?.url || 'https://placehold.co/600x400'}
          alt={message.attachment?.name || 'Attached image'}
          width={400}
          height={300}
          className="mt-2 max-w-sm rounded-lg"
        />
      );
    case 'code':
      return (
        <pre className="mt-1 max-w-xl overflow-x-auto rounded-md bg-muted p-3 font-code text-sm">
          <code>{message.content}</code>
        </pre>
      );
    case 'link':
      return (
        <p className="whitespace-pre-wrap">
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600">
            {message.content}
          </a>
        </p>
      );
    default:
      return <p className="whitespace-pre-wrap">{message.content}</p>;
  }
}
