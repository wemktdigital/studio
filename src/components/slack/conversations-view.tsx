'use client';

import { useState } from 'react';
import { MessageCircle, Hash, Users, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isPrivate?: boolean;
}

interface ConversationsViewProps {
  workspaceId: string;
  channels: Array<{
    id: string;
    name: string;
    is_private: boolean;
  }>;
  directMessages: Array<{
    id: string;
    userId: string;
  }>;
  users: Array<{
    id: string;
    displayName: string;
    handle: string;
  }>;
  onChannelClick: (channelId: string) => void;
  onUserClick: (userId: string) => void;
}

export function ConversationsView({ 
  workspaceId, 
  channels, 
  directMessages, 
  users, 
  onChannelClick, 
  onUserClick 
}: ConversationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'channels' | 'dms'>('all');

  // Combinar canais e DMs em uma lista unificada
  const allConversations: Conversation[] = [
    ...channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      type: 'channel' as const,
      lastMessage: 'Última mensagem do canal...',
      lastMessageTime: '2h',
      unreadCount: Math.floor(Math.random() * 5),
      isPrivate: channel.is_private
    })),
    ...directMessages.map(dm => {
      const user = users.find(u => u.id === dm.userId);
      return {
        id: dm.userId,
        name: user?.displayName || 'Usuário desconhecido',
        type: 'dm' as const,
        lastMessage: 'Última mensagem direta...',
        lastMessageTime: '1h',
        unreadCount: Math.floor(Math.random() * 3)
      };
    })
  ];

  // Filtrar conversas baseado na busca e tipo
  const filteredConversations = allConversations.filter(conversation => {
    const matchesSearch = conversation.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || conversation.type === filterType;
    return matchesSearch && matchesType;
  });

  // Ordenar por tempo da última mensagem (simulado)
  const sortedConversations = filteredConversations.sort((a, b) => {
    // Simular ordenação por atividade recente
    return Math.random() - 0.5;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Todas ({allConversations.length})
          </Button>
          <Button
            variant={filterType === 'channels' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('channels')}
          >
            Canais ({channels.length})
          </Button>
          <Button
            variant={filterType === 'dms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('dms')}
          >
            DMs ({directMessages.length})
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
              {searchQuery && (
                <p className="text-sm mt-2">Tente ajustar sua busca</p>
              )}
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (conversation.type === 'channel') {
                    onChannelClick(conversation.id);
                  } else {
                    onUserClick(conversation.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {conversation.type === 'channel' ? (
                      conversation.isPrivate ? (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {conversation.name}
                      </h3>
                      {conversation.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          Privado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>

                {/* Right side info */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {conversation.lastMessageTime}
                    </p>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
