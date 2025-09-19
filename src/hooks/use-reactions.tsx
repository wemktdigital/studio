'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from './use-toast';

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export function useReactions(messageId: string) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add reaction to message
  const addReaction = useCallback(async (emoji: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to react to messages.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      setReactions(prevReactions => {
        // Find existing reaction
        const existingReactionIndex = prevReactions.findIndex(r => r.emoji === emoji);
        
        if (existingReactionIndex >= 0) {
          // Update existing reaction
          const updatedReactions = [...prevReactions];
          const reaction = updatedReactions[existingReactionIndex];
          
          if (!reaction.users.includes(user.id)) {
            reaction.count += 1;
            reaction.users.push(user.id);
            reaction.hasReacted = true;
          }
          
          return updatedReactions;
        } else {
          // Create new reaction
          const newReaction: Reaction = {
            id: `reaction-${Date.now()}-${Math.random()}`,
            emoji,
            count: 1,
            users: [user.id],
            hasReacted: true
          };
          
          return [...prevReactions, newReaction];
        }
      });
      
      toast({
        title: 'Reaction added',
        description: `Added ${emoji} reaction to message`,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Remove reaction from message
  const removeReaction = useCallback(async (emoji: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to remove reactions.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      setReactions(prevReactions => {
        const existingReactionIndex = prevReactions.findIndex(r => r.emoji === emoji);
        
        if (existingReactionIndex >= 0) {
          const updatedReactions = [...prevReactions];
          const reaction = updatedReactions[existingReactionIndex];
          
          if (reaction.users.includes(user.id)) {
            reaction.count -= 1;
            reaction.users = reaction.users.filter(id => id !== user.id);
            reaction.hasReacted = false;
            
            // Remove reaction if count reaches 0
            if (reaction.count === 0) {
              updatedReactions.splice(existingReactionIndex, 1);
            }
          }
          
          return updatedReactions;
        }
        
        return prevReactions;
      });
      
      toast({
        title: 'Reaction removed',
        description: `Removed ${emoji} reaction from message`,
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove reaction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Toggle reaction (add if not exists, remove if exists)
  const toggleReaction = useCallback(async (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    
    if (existingReaction?.hasReacted) {
      await removeReaction(emoji);
    } else {
      await addReaction(emoji);
    }
  }, [reactions, addReaction, removeReaction]);

  // Get reaction count for specific emoji
  const getReactionCount = useCallback((emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction?.count || 0;
  }, [reactions]);

  // Check if user has reacted with specific emoji
  const hasUserReacted = useCallback((emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction?.hasReacted || false;
  }, [reactions]);

  // Get all reactions for the message
  const getReactions = useCallback(() => {
    return reactions;
  }, [reactions]);

  // Get total reaction count
  const getTotalReactionCount = useCallback(() => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0);
  }, [reactions]);

  return {
    reactions,
    isLoading,
    addReaction,
    removeReaction,
    toggleReaction,
    getReactionCount,
    hasUserReacted,
    getReactions,
    getTotalReactionCount
  };
}
