'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Smile, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  className?: string;
}

const POPULAR_EMOJIS = [
  '👍', '❤️', '😄', '🎉', '🚀', '👏', '🔥', '💯',
  '😍', '🤔', '😢', '😡', '👀', '💪', '🙏', '✨'
];

export default function MessageReactions({ 
  reactions, 
  messageId, 
  onAddReaction, 
  onRemoveReaction,
  className 
}: MessageReactionsProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    
    if (existingReaction?.hasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    
    setIsPopoverOpen(false);
  };

  const handleQuickReaction = (emoji: string) => {
    handleReactionClick(emoji);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <Button
          key={reaction.id}
          variant={reaction.hasReacted ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-6 px-2 py-1 text-xs rounded-full transition-all duration-200",
            reaction.hasReacted 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => handleReactionClick(reaction.emoji)}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      {/* Quick Reaction Buttons for Popular Emojis */}
      {reactions.length === 0 && (
        <div className="flex items-center gap-1">
          {POPULAR_EMOJIS.slice(0, 4).map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-xs rounded-full hover:bg-accent"
              onClick={() => handleQuickReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}

      {/* Add Reaction Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-xs rounded-full hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Add Reaction</div>
            
            {/* Popular Emojis Grid */}
            <div className="grid grid-cols-8 gap-2">
              {POPULAR_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-accent rounded-md"
                  onClick={() => handleReactionClick(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>

            {/* Custom Emoji Input */}
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Type custom emoji (e.g., :smile:, :heart:)
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleReactionClick('😊')}
                >
                  😊
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleReactionClick('💡')}
                >
                  💡
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleReactionClick('⭐')}
                >
                  ⭐
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
