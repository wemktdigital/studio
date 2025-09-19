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

const statusSizeClasses: Record<string, string> = {
  'h-5': 'h-2 w-2 bottom-0 right-0',
  'h-9': 'h-3 w-3 bottom-0 right-0',
  'h-10': 'h-3 w-3 bottom-0 right-0',
  'h-24': 'h-6 w-6 bottom-2 right-2',
}

export function UserAvatar({ user, className, showName = false }: UserAvatarProps) {
  const sizeClass = className?.split(' ').find(cls => cls.startsWith('h-')) || 'h-9';
  const statusPositionClass = statusSizeClasses[sizeClass] || 'h-3 w-3 bottom-0 right-0';

  return (
    <div className={cn("flex items-center gap-2", showName && 'w-full')} data-testid={`user-avatar-${user.id || 'unknown'}`}>
      <div className="relative shrink-0">
        <Avatar className={cn('h-9 w-9', className)}>
          <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || 'User'} />
          <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute rounded-full border-2 border-background',
            statusClasses[user.status || 'offline'],
            statusPositionClass
          )}
        />
      </div>
      {showName && <span className="font-medium truncate">{user.displayName || 'Unknown User'}</span>}
    </div>
  );
}
