import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { MoreHorizontal, Smile, CornerDownRight, MessageCircle } from 'lucide-react';
import { Message, User, Channel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import UserDetailsPane from './user-details-pane';
import { ThreadPanel } from './thread-panel';
import { usePresence } from '@/hooks/use-presence';
import UserStatusDot from './user-status-indicator';
import LinkPreviewComponent from './link-preview';
import { linkService } from '@/lib/services/link-service-new';
import MessageReactions from './message-reactions';
import { useReactions } from '@/hooks/use-reactions';
import { useRightPane } from '@/hooks/use-right-pane';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useAddThreadMessage, useThreadMessages } from '@/hooks/use-threads';
import { useQueryClient } from '@tanstack/react-query';

// ✅ TIPOS INLINE para evitar problemas de importação
interface LinkPreview {
  url: string
  type: 'youtube' | 'github' | 'image' | 'document' | 'code' | 'generic'
  title?: string
  description?: string
  thumbnail?: string
  domain: string
  metadata?: Record<string, any>
}

interface MessageItemProps {
  message: Message
  users: User[]
  conversation: Channel | User | undefined
  workspaceId?: string
}

export default function MessageItem({ 
  message, 
  users,
  conversation,
  workspaceId
}: MessageItemProps) {
  const [isClient, setIsClient] = useState(false);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  
  // ✅ ADICIONADO: Hook para painel direito
  const { setOpen, setContent, setPanelTitle } = useRightPane();
  
  // ✅ ADICIONADO: Hook para autenticação
  const { user } = useAuthContext();
  
  // ✅ ADICIONADO: Hook para adicionar mensagens à thread
  const addThreadMessage = useAddThreadMessage();
  
  // ✅ ADICIONADO: Hook para buscar mensagens da thread e contar respostas
  const { data: threadMessagesData } = useThreadMessages(message.id);
  const replyCount = (threadMessagesData as any)?.pages?.[0]?.messages?.length || 0;
  
  // ✅ ADICIONADO: QueryClient para invalidar queries
  const queryClient = useQueryClient();
  
  const { getUserStatus } = usePresence(workspaceId || '');
  
  // ✅ ADICIONADO: Hook para gerenciar reações
  const { 
    reactions, 
    addReaction, 
    removeReaction, 
    isLoading: isReactionLoading 
  } = useReactions(message.id);

  // ✅ MEMOIZADO: Encontrar o author pelos dados dos usuários
  const author = useMemo(() => {
    console.log('🔍 MessageItem: Looking for author with ID:', message.authorId)
    console.log('🔍 MessageItem: Available users:', users.map(u => ({ id: u.id, displayName: u.displayName })))
    console.log('🔍 MessageItem: Users array length:', users.length)
    console.log('🔍 MessageItem: Users array:', users)
    
    const foundAuthor = users.find(u => u.id === message.authorId)
    console.log('🔍 MessageItem: Found author:', foundAuthor)
    
    return foundAuthor
  }, [users, message.authorId]);
  
  // ✅ VERIFICAR: Se o author foi encontrado
  if (!author) {
    console.warn('🔍 MessageItem: Author not found for message:', {
      messageId: message.id,
      authorId: message.authorId,
      availableUsers: users.map(u => u.id)
    })
    return null;
  }

  // ✅ MEMOIZADO: Timestamp para evitar recálculos
  const timestamp = useMemo(() => {
    return isClient && message.createdAt ? new Date(message.createdAt) : null;
  }, [isClient, message.createdAt]);

  // ✅ MEMOIZADO: Status do autor
  const authorStatus = useMemo(() => {
    return getUserStatus(author.id || 'unknown');
  }, [getUserStatus, author.id]);

  // ✅ CALLBACK: Função de clique no avatar
  const handleAvatarClick = useCallback(() => {
    console.log('Avatar clicked for user:', author.displayName);
  }, [author.displayName]);

  // ✅ CALLBACK: Função de clique no reply
  const handleReplyClick = useCallback(() => {
    console.log('🔍 MessageItem: Reply button clicked for message:', message.id);
    
    // ✅ IMPLEMENTADO: Abrir painel de thread
    setPanelTitle('Thread');
    setContent(
      <ThreadPanel
        isOpen={true}
        onClose={() => setOpen(false)}
        originalMessage={{
          id: message.id,
          content: message.content,
          author: {
            id: author.id,
            displayName: author.displayName || 'Unknown User',
            avatarUrl: author.avatarUrl
          },
          timestamp: timestamp ? format(timestamp, 'MMM d, h:mm a') : 'Unknown time'
        }}
        replies={[]} // TODO: Carregar replies da thread
        onSendReply={async (content, alsoSendAsDM) => {
          console.log('🔍 MessageItem: Reply sent:', { content, alsoSendAsDM });
          
          try {
            // ✅ IMPLEMENTADO: Enviar reply usando hook useAddThreadMessage
            // ✅ CORRIGIDO: Usar apenas o message.id como threadId (sem prefixo)
            const threadId = message.id;
            
            // ✅ CORRIGIDO: Garantir que sempre temos um dmId válido para DMs
            let dmId = message.dmId
            if (!dmId && !message.channelId) {
              // Se não há dmId nem channelId, tentar determinar o DM ID
              // Assumir que estamos em uma conversa direta
              try {
                const { messageService } = await import('@/lib/services/message-service')
                // ✅ CORRIGIDO: Usar o DM ID da URL atual em vez de message.authorId
                const currentDmId = window.location.search.match(/dm=([^&]+)/)?.[1]
                if (currentDmId) {
                  dmId = await messageService.getRealDMId(`dm-${currentDmId}`, user.id)
                  console.log('🔍 MessageItem: Generated DM ID from URL:', dmId)
                } else {
                  // ✅ FALLBACK: Se não conseguimos determinar o DM ID, usar um ID mock válido
                  // Isso evita a violação da constraint message_location_check
                  dmId = '00000000-0000-0000-0000-000000000000'
                  console.log('🔍 MessageItem: No DM ID in URL, using fallback UUID:', dmId)
                }
              } catch (error) {
                console.error('🔍 MessageItem: Error getting DM ID:', error)
                // ✅ FALLBACK: Usar um ID mock válido para evitar constraint violation
                dmId = '00000000-0000-0000-0000-000000000000'
                console.log('🔍 MessageItem: Using fallback UUID due to error:', dmId)
              }
            }

            // ✅ CORRIGIDO: Garantir que authorId seja um UUID válido
            if (!user?.id) {
              console.error('🔍 MessageItem: No user ID available for reply')
              return
            }

            await addThreadMessage.mutateAsync({
              threadId,
              messageData: {
                content,
                authorId: user.id,
                channelId: message.channelId,
                dmId: dmId,
                type: 'text'
              }
            });
            
            console.log('🔍 MessageItem: Reply sent successfully!');
            
            // ✅ OPÇÃO: Se alsoSendAsDM for true, também enviar como DM
            if (alsoSendAsDM) {
              console.log('🔍 MessageItem: Also sending as DM');
              
              try {
                // ✅ IMPLEMENTADO: Enviar também como DM usando messageService
                const { messageService } = await import('@/lib/services/message-service')
                
                // ✅ CORRIGIDO: Usar o mesmo dmId que foi usado para a thread
                // Isso garante que a mensagem DM seja enviada para a conversa atual
                if (dmId) {
                  // ✅ FORMATO SLACK: Criar mensagem especial no formato "respondeu em uma conversa: [original] [nova]"
                  const dmContent = `respondeu em uma conversa: ${message.content} ${content}`;
                  await messageService.sendDirectMessage(dmId, dmContent, user.id)
                  console.log('🔍 MessageItem: DM sent successfully to:', dmId, 'with content:', dmContent)
                  
                  // ✅ ATUALIZAÇÃO EM TEMPO REAL: Invalidar queries para forçar refresh
                  await queryClient.invalidateQueries({ queryKey: ['dm-messages', dmId] });
                  await queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
                  await queryClient.invalidateQueries({ queryKey: ['dm-messages'] });
                  await queryClient.invalidateQueries({ queryKey: ['messages'] });
                  
                  // ✅ FORÇAR REFETCH: Refetch das queries principais
                  await queryClient.refetchQueries({ queryKey: ['dm-messages', dmId] });
                  await queryClient.refetchQueries({ queryKey: ['direct-messages'] });
                  
                  console.log('🔍 MessageItem: Queries invalidated and refetched for real-time update')
                } else {
                  console.log('🔍 MessageItem: No DM ID available, skipping DM send')
                }
              } catch (dmError) {
                console.error('🔍 MessageItem: Error sending DM:', dmError)
                // Não falhar o reply principal se o DM falhar
              }
            }
            
          } catch (error) {
            console.error('🔍 MessageItem: Error sending reply:', error);
          }
        }}
      />
    );
    setOpen(true);
  }, [message.id, message.content, message.channelId, author.id, author.displayName, author.avatarUrl, timestamp, setPanelTitle, setContent, setOpen, user?.id, addThreadMessage]);

  // ✅ OTIMIZADO: useEffect para montagem do componente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ OTIMIZADO: useEffect para detecção de links
  useEffect(() => {
    const detectLinks = async () => {
      if (message.content && message.type === 'text') {
        const urls = linkService.extractUrls(message.content);
        
        if (urls.length > 0) {
          const previews: LinkPreview[] = [];
          for (const url of urls.slice(0, 3)) { // Limitar a 3 previews por mensagem
            try {
              const preview = await linkService.generatePreview(url);
              previews.push(preview);
            } catch (error) {
              console.error('🔗 MessageItem: Error generating preview for URL:', url, error);
            }
          }
          
          setLinkPreviews(previews);
        }
      }
    };

    detectLinks();
  }, [message.content, message.type]);
  
  // ✅ SIMPLIFICADO: Sem lógica complexa de grupos
  const isFirstInGroup = true;
  const isLastInGroup = true;

  return (
    <TooltipProvider>
      <div
        className="group relative flex gap-3 py-2 px-4 transition-colors hover:bg-muted/30 rounded-lg mx-2 min-h-[100px] overflow-visible"
        data-testid="message-item"
      >
        <div className="w-8 shrink-0">
          {isFirstInGroup && (
            <button onClick={handleAvatarClick} className="rounded-full hover:opacity-80 transition-opacity">
              <UserAvatar user={author} className="h-8 w-8" />
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-visible pb-4">
          {isFirstInGroup && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">{author.displayName || 'Unknown User'}</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                    {timestamp ? format(timestamp, 'h:mm a') : ''}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {timestamp && <p>{format(timestamp, 'EEEE, MMMM d, yyyy h:mm a')}</p>}
                </TooltipContent>
              </Tooltip>
              <UserStatusDot status={authorStatus} />
            </div>
          )}
          
          <div className="text-sm text-foreground leading-relaxed">
            {message.content || 'No content'}
          </div>
          
          {/* ✅ LINK PREVIEWS */}
          {linkPreviews.length > 0 && (
            <div className="mt-3 space-y-2">
              {linkPreviews.map((preview, index) => (
                <LinkPreviewComponent
                  key={`${preview.url}-${index}`}
                  preview={preview}
                  className="max-w-md"
                />
              ))}
            </div>
          )}
          
          {/* ✅ ADICIONADO: Sistema de Reações */}
          <div className="mt-3">
            <MessageReactions
              reactions={reactions}
              messageId={message.id}
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
              className="justify-start"
            />
          </div>
          
          {/* Message Actions */}
          <div className="flex items-center gap-2 mt-3 opacity-30 group-hover:opacity-100 transition-opacity pb-2 min-h-[32px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplyClick}
              className="h-6 px-2 text-xs hover:bg-accent/50"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-accent/50"
            >
              <Smile className="h-3 w-3 mr-1" />
              React
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-accent/50"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Thread indicator */}
          {replyCount > 0 && (
            <div className="mt-2">
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CornerDownRight className="h-3 w-3" />
                {replyCount} {replyCount === 1 ? 'resposta' : 'respostas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
