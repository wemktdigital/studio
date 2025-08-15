import React from 'react';
import Image from 'next/image';
import { User, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  user: User;
  className?: string;
  showName?: boolean;
}

const statusClasses: Record<UserStatus, string> = {
  online: 'bg-green-500',
  offline: 'border-2 bg-background',
  away: 'bg-yellow-500',
};

export function UserAvatar({ user, className, showName = false }: UserAvatarProps) {
  return (
    <div className="flex items-center gap-2" data-testid={`user-avatar-${user.id}`}>
      <div className="relative">
        <Avatar className={cn('h-9 w-9', className)}>
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
            statusClasses[user.status]
          )}
        />
      </div>
      {showName && <span className="font-medium">{user.displayName}</span>}
    </div>
  );
}
