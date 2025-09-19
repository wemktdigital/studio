'use client';

import { useState } from 'react';
import { Bell, MessageCircle, Hash, Users, Clock, Filter, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useActivities, useActivitiesByType } from '@/hooks/use-activities';
import { NotificationSettingsModal } from './notification-settings-modal';

interface ActivityItem {
  id: string;
  type: 'message' | 'mention' | 'reaction' | 'thread' | 'channel_join' | 'channel_leave';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  channelId?: string;
  userId?: string;
  userName?: string;
  channelName?: string;
  created_at: string;
  workspace_id: string;
}

interface ActivityViewProps {
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

export function ActivityView({ 
  workspaceId, 
  channels, 
  directMessages, 
  users, 
  onChannelClick, 
  onUserClick 
}: ActivityViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mentions' | 'reactions' | 'threads'>('all');
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  // ✅ DADOS REAIS: Usar hook para buscar atividades reais
  const { data: allActivities = [], isLoading: isLoadingAll, error: errorAll } = useActivities(workspaceId);
  const { data: mentionsActivities = [], isLoading: isLoadingMentions } = useActivitiesByType(workspaceId, 'mentions');
  const { data: reactionsActivities = [], isLoading: isLoadingReactions } = useActivitiesByType(workspaceId, 'reactions');
  const { data: threadsActivities = [], isLoading: isLoadingThreads } = useActivitiesByType(workspaceId, 'threads');

  // ✅ ESTADO DE CARREGAMENTO: Determinar se está carregando
  const isLoading = isLoadingAll || isLoadingMentions || isLoadingReactions || isLoadingThreads;

  // ✅ DADOS FILTRADOS: Usar dados reais baseado no tipo de filtro
  const getFilteredActivities = (): ActivityItem[] => {
    let activities: ActivityItem[] = [];
    
    switch (filterType) {
      case 'mentions':
        activities = mentionsActivities;
        break;
      case 'reactions':
        activities = reactionsActivities;
        break;
      case 'threads':
        activities = threadsActivities;
        break;
      default:
        activities = allActivities;
    }

    // ✅ FILTRO DE BUSCA: Aplicar filtro de texto
    if (searchQuery.trim()) {
      activities = activities.filter(activity => 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.userName && activity.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activity.channelName && activity.channelName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return activities;
  };

  const filteredActivities = getFilteredActivities();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'mention':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'reaction':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'thread':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
      case 'channel_join':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'channel_leave':
        return <Users className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'mention':
        return 'border-l-blue-500';
      case 'reaction':
        return 'border-l-green-500';
      case 'thread':
        return 'border-l-purple-500';
      default:
        return 'border-l-muted';
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.channelId) {
      onChannelClick(activity.channelId);
    } else if (activity.userId) {
      onUserClick(activity.userId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Atividade</h2>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Input
            placeholder="Buscar atividade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="mentions">Menções</TabsTrigger>
            <TabsTrigger value="reactions">Reações</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* ✅ ESTADO DE CARREGAMENTO */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>Carregando atividades...</p>
            </div>
          ) : errorAll ? (
            /* ✅ ESTADO DE ERRO */
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Erro ao carregar atividades</p>
              <p className="text-sm mt-2">Tente novamente em alguns instantes</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            /* ✅ ESTADO VAZIO */
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade encontrada</p>
              {searchQuery ? (
                <p className="text-sm mt-2">Tente ajustar sua busca</p>
              ) : (
                <p className="text-sm mt-2">As atividades aparecerão aqui quando houver menções ou threads</p>
              )}
            </div>
          ) : (
            /* ✅ LISTA DE ATIVIDADES */
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                  getActivityColor(activity.type),
                  activity.unread && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
                onClick={() => handleActivityClick(activity)}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {activity.title}
                    </h3>
                    {activity.unread && (
                      <Badge variant="destructive" className="text-xs">
                        Novo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                    {activity.channelName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {activity.channelName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setIsNotificationSettingsOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Configurar notificações
          </Button>
        </div>
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
