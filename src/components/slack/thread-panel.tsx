'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserAvatar } from './user-avatar';
import { cn } from '@/lib/utils';
import { useThreadMessages } from '@/hooks/use-threads';

interface ThreadMessage {
  id: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  timestamp: string;
  isEdited?: boolean;
}

interface ThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  originalMessage: {
    id: string;
    content: string;
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
    timestamp: string;
    isEdited?: boolean;
  };
  replies: ThreadMessage[];
  onSendReply: (content: string, alsoSendAsDM: boolean) => void;
}

export function ThreadPanel({ 
  isOpen, 
  onClose, 
  originalMessage, 
  replies, 
  onSendReply 
}: ThreadPanelProps) {
  const [replyContent, setReplyContent] = useState('');
  const [alsoSendAsDM, setAlsoSendAsDM] = useState(false);
  
  // ✅ ADICIONADO: Referência para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ ADICIONADO: Usar hook para buscar mensagens da thread
  // ✅ CORRIGIDO: Usar apenas o message.id como threadId (sem prefixo)
  const threadId = originalMessage.id;
  const { data: threadMessagesData } = useThreadMessages(threadId);
  
  // ✅ OBTER: Mensagens reais da thread ou usar replies como fallback
  const threadMessages = (threadMessagesData as any)?.pages?.[0]?.messages || replies;

  // ✅ ADICIONADO: Auto-scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [threadMessages])

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendReply(replyContent.trim(), alsoSendAsDM);
      setReplyContent('');
      setAlsoSendAsDM(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-border bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Conversa</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronDown className="h-3 w-3" />
          </Button>
          {/* ✅ ADICIONADO: Contador de respostas */}
          {threadMessages && threadMessages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {threadMessages.length} {threadMessages.length === 1 ? 'resposta' : 'respostas'}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Original Message */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-3">
            <UserAvatar 
              user={originalMessage.author} 
              className="h-8 w-8 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {originalMessage.author.displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {originalMessage.timestamp}
                </span>
                {originalMessage.isEdited && (
                  <span className="text-xs text-muted-foreground">(editado)</span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {originalMessage.content}
              </p>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="p-4 space-y-4">
          {threadMessages.map((reply: any) => (
            <div key={reply.id} className="flex gap-3">
              <UserAvatar 
                user={reply.author} 
                className="h-6 w-6 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {reply.author?.displayName || reply.author?.display_name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {reply.timestamp || new Date(reply.created_at).toLocaleTimeString()}
                  </span>
                  {reply.isEdited && (
                    <span className="text-xs text-muted-foreground">(editado)</span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
          {/* ✅ ADICIONADO: Div de referência para scroll automático */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-border">
        <div className="space-y-3">
          <Textarea
            placeholder="Responder..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="also-send-dm"
                checked={alsoSendAsDM}
                onCheckedChange={(checked) => setAlsoSendAsDM(checked as boolean)}
              />
              <label
                htmlFor="also-send-dm"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Também enviar como mensagem no canal
              </label>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                onClick={handleSendReply}
                disabled={!replyContent.trim()}
                className="h-8 px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
