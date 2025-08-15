import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { MoreHorizontal, Smile, CornerDownRight } from 'lucide-react';
import { Message, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRightPane } from '@/hooks/use-right-pane';
import UserDetailsPane from './user-details-pane';
import ThreadPane from './thread-pane';
import { users as mockUsers } from '@/lib/data'; // Import mock users for tooltip

interface MessageItemProps {
  message: Message;
  author: User;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageItem({ message, author, isFirstInGroup }: MessageItemProps) {
  const [isClient, setIsClient] = useState(false);
  const { setOpen, setContent, setPanelTitle } = useRightPane();

  const handleAvatarClick = () => {
    setPanelTitle('Profile');
    setContent(<UserDetailsPane user={author} />);
    setOpen(true);
  };

  const handleReplyClick = () => {
    setPanelTitle('Thread');
    setContent(<ThreadPane originalMessage={message} author={author} />);
    setOpen(true);
  };


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const timestamp = isClient ? new Date(message.createdAt) : null;

  return (
    <TooltipProvider>
      <div
        className="group relative flex gap-4 py-1 pr-10 transition-colors hover:bg-muted/50"
        data-testid="message-item"
      >
        <div className="w-10 shrink-0">
          {isFirstInGroup && (
            <button onClick={handleAvatarClick} className="rounded-full">
              <UserAvatar user={author} className="h-10 w-10" />
            </button>
          )}
        </div>
        <div className="flex-1">
          {isFirstInGroup && (
            <div className="flex items-baseline gap-2">
              <span className="font-bold">{author.displayName}</span>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground">
                      {timestamp ? format(timestamp, 'h:mm a') : ''}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {timestamp && <p>{format(timestamp, 'EEEE, MMMM d, yyyy h:mm a')}</p>}
                  </TooltipContent>
                </Tooltip>
            </div>
          )}
          <MessageContent message={message} />
          {message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((reaction) => {
                const reactingUsers = reaction.users.map(userId => mockUsers.find(u => u.id === userId)?.displayName || 'Unknown').join(', ');
                return (
                  <Tooltip key={reaction.emoji} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-sm transition-colors hover:border-primary"
                      >
                        <span>{reaction.emoji}</span>
                        <span className="font-medium">{reaction.count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{reactingUsers} reacted with {reaction.emoji}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute right-4 top-0 -translate-y-1/2 rounded-md border bg-card opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <div className="flex items-center">
              <MessageActionTooltip label="Add reaction">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
              </MessageActionTooltip>
              <MessageActionTooltip label="Reply in thread">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReplyClick}><CornerDownRight className="h-4 w-4" /></Button>
              </MessageActionTooltip>
              <MessageActionTooltip label="More actions">
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
              </MessageActionTooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

const MessageActionTooltip = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <Tooltip delayDuration={100}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent><p>{label}</p></TooltipContent>
  </Tooltip>
);


export function MessageContent({ message }: { message: Message }) {
  switch (message.type) {
    case 'image':
      return (
        <Image
          src={message.attachment?.url || 'https://placehold.co/600x400'}
          alt={message.attachment?.name || 'Attached image'}
          width={400}
          height={300}
          className="mt-2 max-w-sm rounded-lg"
          data-ai-hint={message.dataAiHint}
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
