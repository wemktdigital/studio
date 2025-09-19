'use client';

import { useState } from 'react';
import { Users, Search, UserPlus, Mail, MessageCircle, Shield, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  displayName: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  userLevel?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface PeopleViewProps {
  workspaceId: string;
  users: User[];
  onUserClick: (userId: string) => void;
}

export function PeopleView({ 
  workspaceId, 
  users, 
  onUserClick 
}: PeopleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'admins'>('all');

  // Filtrar usuários baseado na busca e tipo
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = true;
    if (filterType === 'online') {
      matchesType = user.isOnline === true;
    } else if (filterType === 'admins') {
      matchesType = user.userLevel === 'super_admin' || user.userLevel === 'admin';
    }
    
    return matchesSearch && matchesType;
  });

  // Ordenar usuários: online primeiro, depois por nome
  const sortedUsers = filteredUsers.sort((a, b) => {
    // Online primeiro
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    
    // Depois por nome
    return a.displayName.localeCompare(b.displayName);
  });

  const getLevelIcon = (userLevel?: string) => {
    switch (userLevel) {
      case 'super_admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (userLevel?: string) => {
    switch (userLevel) {
      case 'super_admin':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Membro</Badge>;
    }
  };

  const handleSendMessage = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUserClick(userId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Pessoas</h2>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pessoas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
            <TabsTrigger value="online">Online ({users.filter(u => u.isOnline).length})</TabsTrigger>
            <TabsTrigger value="admins">Admins ({users.filter(u => u.userLevel === 'super_admin' || u.userLevel === 'admin').length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* People List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma pessoa encontrada</p>
              {searchQuery && (
                <p className="text-sm mt-2">Tente ajustar sua busca</p>
              )}
            </div>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={user.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      <AvatarFallback>
                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {user.displayName}
                      </h3>
                      {getLevelIcon(user.userLevel)}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.handle}
                      </p>
                      {getLevelBadge(user.userLevel)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    {user.lastSeen && !user.isOnline && (
                      <p className="text-xs text-muted-foreground">
                        Visto por último: {user.lastSeen}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleSendMessage(user.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mensagem
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <Button variant="outline" size="sm" className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar pessoas
          </Button>
        </div>
      </div>
    </div>
  );
}
