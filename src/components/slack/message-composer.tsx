'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, AtSign, Smile } from 'lucide-radix';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Channel, User } from '@/lib/types';
import { getSmartSuggestions } from '@/ai/flows/smart-suggestion';
import SmartSuggestionPopover from './smart-suggestion-popover';

interface MessageComposerProps {
  conversation: Channel | User | undefined;
}

export default function MessageComposer({ conversation }: MessageComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState({ prefix: '', query: '' });

  const placeholder = conversation
    ? 'name' in conversation
      ? `Message #${conversation.name}`
      : `Message @${conversation.displayName}`
    : 'Send a message';
  
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);

    const match = value.match(/([@#])(\w*)$/);
    if (match) {
        setSuggestionQuery({ prefix: match[1], query: match[2] });
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
        if(suggestionQuery.prefix && showSuggestions) {
            // TODO: Add loading state
            const result = await getSmartSuggestions(suggestionQuery);
            setSuggestions(result.suggestions);
        }
    };
    fetchSuggestions();
  }, [suggestionQuery, showSuggestions]);

  const handleSuggestionSelect = (suggestion: string) => {
    setText(prev => prev.replace(/([@#])\w*$/, `${suggestionQuery.prefix}${suggestion} `));
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
  }


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
      <div className="relative rounded-lg border bg-card p-2">
        {showSuggestions && (
          <SmartSuggestionPopover
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            prefix={suggestionQuery.prefix}
          />
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-48 resize-none border-none bg-transparent p-2 shadow-none focus-visible:ring-0"
          rows={1}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Attach file">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Record audio">
              <Mic className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Mention someone">
              <AtSign className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" aria-label="Add emoji">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button onClick={handleSend} disabled={!text.trim()} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
