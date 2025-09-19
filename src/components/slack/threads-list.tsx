'use client';

import React from 'react';
import { CornerDownRight, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useChannelThreads } from '@/hooks/use-threads';
import { useRightPane } from '@/hooks/use-right-pane';
import ThreadPane from './thread-pane';
import { Message, User } from '@/lib/types';

interface ThreadsListProps {
    channelId: string;
    workspaceId: string;
}

interface ThreadItemProps {
    thread: {
        id: string;
        title: string;
        message_count: number;
        participant_count: number;
        last_message_at: string;
        original_message: {
            id: string;
            content: string;
            author_id: string;
            created_at: string;
        };
        channel: {
            id: string;
            name: string;
        };
    };
    onThreadClick: (thread: any) => void;
}

const ThreadItem = ({ thread, onThreadClick }: ThreadItemProps) => {
    const lastMessageTime = new Date(thread.last_message_at);
    const isRecent = Date.now() - lastMessageTime.getTime() < 24 * 60 * 60 * 1000; // 24 hours
    
    return (
        <button
            onClick={() => onThreadClick(thread)}
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50",
                "border border-transparent hover:border-border"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-1">
                    <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                            {thread.title || 'Thread'}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                            #{thread.channel?.name || 'unknown'}
                        </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {thread.original_message?.content || 'No content'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{thread.message_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                                {isRecent 
                                    ? format(lastMessageTime, 'h:mm a')
                                    : format(lastMessageTime, 'MMM d')
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
};

const ThreadsList = ({ channelId, workspaceId }: ThreadsListProps) => {
    const { setOpen, setContent, setPanelTitle } = useRightPane();
    const { data: threads, isLoading, error } = useChannelThreads(channelId);
    
    // Debug logs
    console.log('🔍 ThreadsList: Rendering with:', { channelId, workspaceId });
    console.log('🔍 ThreadsList: Hook data:', { threads, isLoading, error });
    
    const handleThreadClick = (thread: any) => {
        console.log('🔍 ThreadsList: Thread clicked:', thread);
        
        // Create a mock message object for the ThreadPane
        const mockMessage: Message = {
            id: thread.original_message?.id || 'mock-message-id',
            content: thread.original_message?.content || 'No content',
            type: 'text',
            authorId: thread.original_message?.author_id || 'mock-author-id',
            channelId: thread.channel?.id || 'mock-channel-id',
            createdAt: thread.original_message?.created_at || new Date().toISOString(),
            reactions: []
        };
        
        // Create a mock user object (we'll need to get the real user data)
        const mockUser: User = {
            id: thread.original_message?.author_id || 'mock-author-id',
            displayName: 'User', // We'll need to get this from the database
            handle: 'user',
            avatarUrl: null
        };
        
        setPanelTitle('Thread');
        setContent(<ThreadPane originalMessage={mockMessage} author={mockUser} />);
        setOpen(true);
    };
    
    if (isLoading) {
        console.log('🔍 ThreadsList: Loading state');
        return (
            <div className="p-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }
    
    if (error) {
        console.log('🔍 ThreadsList: Error state:', error);
        return (
            <div className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                    Error loading threads
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                    {error.message || 'Unknown error'}
                </p>
            </div>
        );
    }
    
    if (!threads || threads.length === 0) {
        console.log('🔍 ThreadsList: No threads found');
        return (
            <div className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                    No threads yet
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                    Reply to any message to start a thread
                </p>
            </div>
        );
    }
    
    console.log('🔍 ThreadsList: Rendering threads:', threads);
    
    return (
        <div className="space-y-1">
            <div className="px-4 py-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                    Threads ({threads.length})
                </h3>
            </div>
            
            {threads.map((thread, index) => (
                <ThreadItem
                    key={`${thread.id}-${index}`}
                    thread={thread}
                    onThreadClick={handleThreadClick}
                />
            ))}
        </div>
    );
};

export default ThreadsList;
