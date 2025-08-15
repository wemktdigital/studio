'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';

import { Workspace } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export default function WorkspaceSidebar({ workspaces, activeWorkspaceId }: WorkspaceSidebarProps) {
  return (
    <TooltipProvider>
      <div
        className="flex h-full w-20 flex-col items-center gap-2 overflow-y-auto bg-sidebar p-3"
        data-testid="workspace-sidebar"
      >
        <nav className="flex flex-col items-center gap-2">
          {workspaces.map((ws) => (
            <Tooltip key={ws.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={`/w/${ws.id}`}>
                  <div
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-accent transition-all duration-200 hover:bg-sidebar-accent/80',
                       activeWorkspaceId === ws.id && 'bg-primary-foreground'
                    )}
                  >
                    <Image
                      src={ws.logoUrl}
                      alt={`${ws.name} logo`}
                      width={40}
                      height={40}
                      className={cn(
                        'rounded-lg transition-all duration-200',
                         activeWorkspaceId === ws.id ? 'transform scale-90' : ''
                      )}
                    />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{ws.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mt-2 h-12 w-12 rounded-2xl bg-sidebar-accent hover:bg-green-500/20 hover:text-green-500" aria-label="Create workspace">
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a workspace</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
