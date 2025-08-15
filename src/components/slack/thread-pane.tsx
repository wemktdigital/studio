'use client';

import React from 'react';
import { Message, User } from '@/lib/types';
import { MessageContent, MessageItem } from './message';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, AtSign, Smile, Paperclip } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { format } from 'date-fns';

interface ThreadPaneProps {
    originalMessage: Message;
    author: User;
}

const ThreadPane = ({ originalMessage, author }: ThreadPaneProps) => {
    // Mock replies for demonstration
    const replies: Message[] = [
        { id: 'reply-1', authorId: '3', content: 'This is a reply in the thread.', type: 'text', createdAt: new Date(new Date(originalMessage.createdAt).getTime() + 60000).toISOString(), reactions: [] },
        { id: 'reply-2', authorId: '1', content: 'I agree!', type: 'text', createdAt: new Date(new Date(originalMessage.createdAt).getTime() + 120000).toISOString(), reactions: [] },
    ];

    const timestamp = new Date(originalMessage.createdAt);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 flex-grow overflow-y-auto">
                {/* Original Message */}
                <div className="flex gap-3">
                    <UserAvatar user={author} className="h-10 w-10" />
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold">{author.displayName}</span>
                            <span className="text-xs text-muted-foreground">
                                {format(timestamp, 'h:mm a')}
                            </span>
                        </div>
                        <MessageContent message={originalMessage} />
                    </div>
                </div>

                <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-4 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  {/* For demonstration, we'll just show a placeholder for replies */}
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Replies would be listed here.
                  </p>
                </div>
            </div>

            {/* Reply Composer */}
            <div className="border-t bg-background p-4 mt-auto">
                <div className="relative rounded-lg border bg-card">
                    <Textarea
                        placeholder={`Reply to thread...`}
                        className="max-h-48 resize-none border-none bg-transparent p-2 pr-24 shadow-none focus-visible:ring-0"
                        rows={1}
                    />
                     <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Attach file">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Add emoji">
                          <Smile className="h-5 w-5" />
                        </Button>
                        <Button disabled aria-label="Send message" size="icon" className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-8 w-8'>
                          <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreadPane;
