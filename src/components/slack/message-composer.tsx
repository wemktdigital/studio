'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Channel, User } from '@/lib/types';
import { getSmartSuggestions, SmartSuggestionOutput } from '@/ai/flows/smart-suggestion';
import SmartSuggestionPopover from './smart-suggestion-popover';
import { UserMentionSuggestions } from './user-mention-suggestions';
import { useToast } from '@/hooks/use-toast';
import { useChannelMessages } from '@/hooks/use-messages';
import { useAuthContext } from '@/components/providers/auth-provider';

interface MessageComposerProps {
  conversation: Channel | User | undefined;
  channelId?: string;
  workspaceId?: string;
}

export default function MessageComposer({ conversation, channelId, workspaceId }: MessageComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestionOutput['suggestions']>([]);
  const [isSuggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState({ prefix: '', query: '' });
  
  // ✅ ADICIONADO: Integração com hooks de mensagens
  const { sendMessage, isSending } = useChannelMessages(channelId || '', workspaceId)
  const { user } = useAuthContext()
  
  // Mention system state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });
  
  const { toast } = useToast();

  const placeholder = conversation
    ? 'name' in conversation
      ? `Message #${conversation.name}`
      : `Message @${conversation.displayName}`
    : 'Send a message';
  
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);

    // Check for mentions (@username)
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(`@${mentionMatch[1]}`);
      setShowMentions(true);
      setShowSuggestions(false);
      
      // Calculate position for mention suggestions
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        const charWidth = 8; // Approximate character width
        const x = rect.left + (currentLine.length * charWidth);
        const y = rect.bottom + 10;
        setMentionPosition({ x, y });
      }
      return;
    }

    // Check for other suggestions (#channel, etc.)
    const match = value.match(/([#])(\w*)$/);
    if (match) {
      setSuggestionQuery({ prefix: match[1], query: match[2] });
      setShowSuggestions(true);
      setShowMentions(false);
    } else {
      setShowSuggestions(false);
      setShowMentions(false);
      setSuggestions([]);
    }
  };

  const fetchSuggestions = useCallback(async () => {
    if (suggestionQuery.prefix && showSuggestions) {
      setSuggestionLoading(true);
      try {
        const result = await getSmartSuggestions(suggestionQuery);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast({
            title: 'Error',
            description: 'Could not fetch smart suggestions.',
            variant: 'destructive'
        })
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }
  }, [suggestionQuery, showSuggestions, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchSuggestions();
    }, 300); // Debounce API calls

    return () => clearTimeout(debounceTimer);
  }, [fetchSuggestions]);

  // ✅ ADICIONADO: Função para enviar mensagem usando o hook
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || !channelId || !user) {
      toast({
        title: 'Error',
        description: 'Please enter a message and ensure you are in a channel.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await sendMessage(text.trim());
      setText('');
      setShowSuggestions(false);
      setShowMentions(false);
      
      // Toast removido - usuário vê a mensagem aparecer diretamente na tela
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'channel') {
      setText(prev => prev.replace(/#\w*$/, `#${suggestion.name}`));
    } else if (suggestion.type === 'user') {
      setText(prev => prev.replace(/@\w*$/, `@${suggestion.handle}`));
    }
    setShowSuggestions(false);
    setShowMentions(false);
  };

  const handleMentionSelect = (user: User) => {
    setText(prev => prev.replace(/@\w*$/, `@${user.handle}`));
    setShowMentions(false);
  };

  return (
    <div className="relative border-t bg-background p-4">
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none pr-8"
            disabled={isSending}
          />
          
          {/* Smart Suggestions Popover */}
          {showSuggestions && (
            <SmartSuggestionPopover
              suggestions={suggestions}
              isLoading={isSuggestionLoading}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
            />
          )}
          
          {/* User Mention Suggestions */}
          {showMentions && (
            <UserMentionSuggestions
              query={mentionQuery}
              position={mentionPosition}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
            />
          )}
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={!text.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
