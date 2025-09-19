'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  isActive?: boolean;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onAddChannel: () => void;
}

export default function ChannelListFixed({
  channels,
  activeChannelId,
  onChannelSelect,
  onAddChannel
}: ChannelListProps) {
  return (
    <div className="space-y-2">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Canais
        </h3>
      </div>
      
      <div className="space-y-1">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant={activeChannelId === channel.id ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start px-3 py-2 h-auto',
              activeChannelId === channel.id
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            onClick={() => onChannelSelect(channel.id)}
          >
            <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate font-medium">
              {channel.name || `Canal ${channel.id}`}
            </span>
          </Button>
        ))}
        
        {channels.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Nenhum canal encontrado
          </div>
        )}
      </div>
      
      <div className="px-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddChannel}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar canais
        </Button>
      </div>
    </div>
  );
}
