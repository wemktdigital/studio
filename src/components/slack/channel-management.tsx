'use client';

import { useState } from 'react';
import { Edit, Trash2, MoreHorizontal, Hash, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChannelService } from '@/lib/services/channel-service';
import { useUserLevels } from '@/hooks/use-user-levels';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

interface ChannelManagementProps {
  channel: Channel;
  workspaceId: string;
  onChannelUpdate?: () => void;
  onChannelDelete?: () => void;
  className?: string;
}

export function ChannelManagement({ 
  channel, 
  workspaceId, 
  onChannelUpdate, 
  onChannelDelete,
  className 
}: ChannelManagementProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: channel.name,
    description: channel.description || ''
  });
  
  const { toast } = useToast();
  const { currentUserLevel, can } = useUserLevels();
  const channelService = new ChannelService();

  // Verificar permissões
  const canEditChannels = can.createChannels?.() || can.isSuperAdmin?.() || currentUserLevel?.userLevel === 'super_admin' || false;
  const canDeleteChannels = can.deleteChannels?.() || can.isSuperAdmin?.() || currentUserLevel?.userLevel === 'super_admin' || false;

  // Debug logs
  console.log('🔍 ChannelManagement: Rendering for channel:', channel.name);
  console.log('🔍 ChannelManagement: User level:', currentUserLevel);
  console.log('🔍 ChannelManagement: Can object:', can);
  console.log('🔍 ChannelManagement: Permissions:', { canEditChannels, canDeleteChannels });
  console.log('🔍 ChannelManagement: can.createChannels():', can.createChannels?.());
  console.log('🔍 ChannelManagement: can.isSuperAdmin():', can.isSuperAdmin?.());
  console.log('🔍 ChannelManagement: currentUserLevel?.userLevel:', currentUserLevel?.userLevel);

  const handleEdit = async () => {
    if (!canEditChannels) {
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para editar canais.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await channelService.updateChannel(channel.id, {
        name: editForm.name,
        description: editForm.description || null
      });

      toast({
        title: 'Canal atualizado',
        description: 'O canal foi atualizado com sucesso!'
      });

      setIsEditDialogOpen(false);
      onChannelUpdate?.();
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o canal. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteChannels) {
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para excluir canais.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await channelService.deleteChannel(channel.id);

      toast({
        title: 'Canal excluído',
        description: 'O canal foi excluído com sucesso!'
      });

      setIsDeleteDialogOpen(false);
      onChannelDelete?.();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o canal. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-6 w-6 p-0 bg-sidebar-accent/20 hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all",
              className
            )}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEditChannels && (
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar canal
            </DropdownMenuItem>
          )}
          {canDeleteChannels && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir canal
              </DropdownMenuItem>
            </>
          )}
          {!canEditChannels && !canDeleteChannels && (
            <DropdownMenuItem disabled>
              Sem permissões para gerenciar canais
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Canal</DialogTitle>
            <DialogDescription>
              Atualize o nome e descrição do canal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do canal</Label>
              <div className="flex items-center gap-2">
                {channel.is_private ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Hash className="h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do canal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste canal..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !editForm.name.trim()}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Canal</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o canal "{channel.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isLoading}
            >
              {isLoading ? 'Excluindo...' : 'Excluir Canal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
