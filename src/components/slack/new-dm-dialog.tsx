
'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { Button } from '../ui/button';

interface NewDmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  users: User[];
  onSelectUser: (userId: string) => void;
}

export function NewDmDialog({ isOpen, onOpenChange, users, onSelectUser }: NewDmDialogProps) {
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.displayName.toLowerCase().includes(search.toLowerCase()) ||
      user.handle.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Select a user to start a direct message conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4">
          <Input
            placeholder="Search for a user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-72 border-t">
          <div className="p-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
                >
                  <UserAvatar user={user} />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground">@{user.handle}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
