'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AtSign, MessageSquare, Hash, Check, CheckCheck } from 'lucide-react'
import { useMentions } from '@/hooks/use-mentions'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function MentionsList() {
  const [isVisible, setIsVisible] = useState(false)
  const {
    unreadMentions,
    allMentions,
    unreadMentionCount,
    hasUnreadMentions,
    markMentionAsRead,
    markAllMentionsAsRead,
    isLoadingMentions
  } = useMentions()

  const handleMarkAsRead = async (mentionId: string) => {
    try {
      await markMentionAsRead.mutateAsync(mentionId)
    } catch (error) {
      console.error('Error marking mention as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMentionsAsRead.mutateAsync()
    } catch (error) {
      console.error('Error marking all mentions as read:', error)
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="relative"
      >
        <AtSign className="h-4 w-4 mr-2" />
        Menções
        {hasUnreadMentions && (
          <Badge 
            variant="destructive" 
            className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadMentionCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-80 shadow-lg max-h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AtSign className="h-4 w-4" />
            Menções
            {hasUnreadMentions && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadMentionCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasUnreadMentions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
                disabled={markAllMentionsAsRead.isPending}
              >
                {markAllMentionsAsRead.isPending ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoadingMentions ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          ) : allMentions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AtSign className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma menção ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use @username para mencionar alguém
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {allMentions.map((mention) => (
                <div
                  key={mention.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    mention.is_read 
                      ? "hover:bg-muted/50" 
                      : "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary"
                  )}
                  onClick={() => !mention.is_read && handleMarkAsRead(mention.id)}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage 
                      src={mention.mentioned_by_user?.avatarUrl} 
                      alt={mention.mentioned_by_user?.displayName}
                    />
                    <AvatarFallback>
                      {mention.mentioned_by_user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {mention.mentioned_by_user?.displayName || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        mencionou você
                      </span>
                      {mention.channel && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          {mention.channel.name}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {mention.message?.content || 'Mensagem não disponível'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(mention.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                      
                      {!mention.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(mention.id)
                          }}
                          className="h-6 px-2 text-xs"
                          disabled={markMentionAsRead.isPending}
                        >
                          {markMentionAsRead.isPending ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
