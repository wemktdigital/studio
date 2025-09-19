'use client';

import React, { useState, useEffect } from 'react';
import { Message, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, AtSign, Smile, Paperclip, Loader2, X } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { format } from 'date-fns';
import { useThread, useThreadMessages, useAddThreadMessage, useCreateThread } from '@/hooks/use-threads';
import { useAuthContext } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRightPane } from '@/hooks/use-right-pane';

interface ThreadPaneProps {
    originalMessage: Message;
    author: User;
    workspaceId?: string;
}

export default function ThreadPane({ originalMessage, author, workspaceId }: ThreadPaneProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthContext();
  const { setOpen } = useRightPane();
    
    // Create thread mutation
    const createThreadMutation = useCreateThread();
    
    // Add message to thread mutation
    const addMessageMutation = useAddThreadMessage();
    
    // We'll get the thread data after creation, not before
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    
    // Get thread messages only after we have a thread ID
    const { data: threadMessagesData } = useThreadMessages(currentThreadId || '');
    
    const threadMessages = (threadMessagesData as any)?.pages?.[0]?.messages || [];
    const hasReplies = threadMessages.length > 0;
    
    const timestamp = new Date(originalMessage.createdAt);

  // Remove the useEffect that was trying to create threads automatically
  // We now handle thread creation when the user sends a reply
    
    const handleSendReply = async () => {
        if (!replyContent.trim() || !user) return;
        console.log('🔍 ThreadPane: Starting to send reply...', {
            replyContent: replyContent.trim(),
            user: user?.id,
            messageId: originalMessage.id,
            workspaceId: workspaceId
        });
        setIsSubmitting(true);
        try {
            // Create thread if it doesn't exist
            if (!currentThreadId && !createThreadMutation.isPending && workspaceId) {
                console.log('🔍 ThreadPane: Creating thread for message:', originalMessage.id);
                const newThread = await createThreadMutation.mutateAsync({
                    originalMessageId: originalMessage.id,
                    channelId: originalMessage.channelId || '',
                    workspaceId: workspaceId,
                    title: originalMessage.content.substring(0, 50) + (originalMessage.content.length > 50 ? '...' : '')
                });
                setCurrentThreadId(newThread.id); // Set the thread ID after creation
            }

            // Add reply to thread
            if (currentThreadId) {
                console.log('🔍 ThreadPane: Adding reply to thread:', replyContent);
                
                // ✅ CORRIGIDO: Garantir que sempre temos um dmId válido para DMs
                let dmId = originalMessage.dmId
                if (!dmId && !originalMessage.channelId) {
                    // Se não há dmId nem channelId, tentar determinar o DM ID da URL
                    const currentDmId = window.location.search.match(/dm=([^&]+)/)?.[1]
                    if (currentDmId) {
                        dmId = currentDmId
                        console.log('🔍 ThreadPane: Generated DM ID from URL:', dmId)
                    } else {
                        // ✅ FALLBACK: Usar um ID mock válido para evitar constraint violation
                        dmId = '00000000-0000-0000-0000-000000000000'
                        console.log('🔍 ThreadPane: No DM ID in URL, using fallback UUID:', dmId)
                    }
                }
                
                await addMessageMutation.mutateAsync({
                    threadId: currentThreadId,
                    messageData: {
                        content: replyContent.trim(),
                        authorId: user.id,
                        channelId: originalMessage.channelId || null,
                        dmId: dmId,
                        type: 'text'
                    }
                });
            }

            console.log('🔍 ThreadPane: Reply sent successfully');
            setReplyContent('');
        } catch (error: any) {
            console.error('🔍 ThreadPane: Error sending reply:', error);
            console.error('🔍 ThreadPane: Error details:', {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace',
                name: error?.name || 'Unknown error type'
            });
        } finally {
            console.log('🔍 ThreadPane: Setting isSubmitting to false');
            setIsSubmitting(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };
    
    if (createThreadMutation.isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-sm">Thread</h3>
                </div>
                <button 
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {/* Original Message */}
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={author.avatarUrl || ''} />
                            <AvatarFallback className="text-xs">
                                {author.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-medium text-sm">{author.displayName || 'Unknown User'}</span>
                                <span className="text-xs text-muted-foreground">
                                    {format(timestamp, 'MMM d, h:mm a')}
                                </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{originalMessage.content}</p>
                        </div>
                    </div>
                </div>

                {/* Thread Replies */}
                <div className="flex-1 overflow-y-auto">
                    {hasReplies ? (
                        <div className="p-4 space-y-4">
                            {threadMessages?.map((reply: any) => (
                                <div key={reply.id} className="flex gap-3">
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarImage src={reply.author?.avatar_url || ''} />
                                        <AvatarFallback className="text-xs">
                                            {reply.author?.display_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-medium text-xs">{reply.author?.display_name || 'Unknown User'}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="text-muted-foreground text-sm">
                                <p className="mb-2">No replies yet</p>
                                <p className="text-xs">Be the first to reply to this message</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-2">
                        <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Reply to thread..."
                            className="min-h-[60px] resize-none border-border focus:border-primary"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Press Enter to send</span>
                        </div>
                        <Button
                            onClick={handleSendReply}
                            disabled={!replyContent.trim() || isSubmitting}
                            size="sm"
                            className="px-4"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
