'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Mic, Send, AtSign, Smile } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Channel, User } from '@/lib/types';
import { getSmartSuggestions, SmartSuggestionOutput } from '@/ai/flows/smart-suggestion';
import SmartSuggestionPopover from './smart-suggestion-popover';
import { useToast } from '@/hooks/use-toast';

interface MessageComposerProps {
  conversation: Channel | User | undefined;
}

export default function MessageComposer({ conversation }: MessageComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestionOutput['suggestions']>([]);
  const [isSuggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState({ prefix: '', query: '' });
  const { toast } = useToast();

  const placeholder = conversation
    ? 'name' in conversation
      ? `Message #${conversation.name}`
      : `Message @${conversation.displayName}`
    : 'Send a message';
  
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);

    // Regex to detect if the user is typing @ or # at the end of the text
    const match = value.match(/([@#])(\w*)$/);

    if (match) {
        setSuggestionQuery({ prefix: match[1], query: match[2] });
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
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


  const handleSuggestionSelect = (name: string) => {
    setText(prev => prev.replace(/([@#])\w*$/, `${suggestionQuery.prefix}${name} `));
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
  }


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // We need a slight delay to allow the DOM to update before calculating scrollHeight
      setTimeout(() => {
          if(textareaRef.current) {
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
          }
      }, 0)
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim()) {
      console.log('Sending message:', text);
      // TODO: Implement actual message sending logic
      setText('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4" data-testid="message-composer">
      <div className="relative rounded-lg border bg-card">
        {showSuggestions && (
          <SmartSuggestionPopover
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            prefix={suggestionQuery.prefix}
            isLoading={isSuggestionLoading}
          />
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
            <Button onClick={handleSend} disabled={!text.trim()} aria-label="Send message" size="icon" className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-8 w-8'>
              <Send className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
