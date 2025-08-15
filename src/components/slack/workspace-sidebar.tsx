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
        className="flex h-full w-20 flex-col items-center gap-2 overflow-y-auto bg-background p-3"
        data-testid="workspace-sidebar"
      >
        <nav className="flex flex-col items-center gap-2">
          {workspaces.map((ws) => (
            <Tooltip key={ws.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={`/w/${ws.id}`}>
                  <div
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-all duration-200 hover:rounded-2xl',
                      activeWorkspaceId === ws.id
                        ? 'rounded-2xl bg-primary text-primary-foreground'
                        : 'hover:bg-primary/20'
                    )}
                  >
                    <Image
                      src={ws.logoUrl}
                      alt={`${ws.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                    <div
                      className={cn(
                        'absolute -left-2 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-all duration-200',
                        activeWorkspaceId === ws.id ? 'h-8' : 'h-0 group-hover:h-4'
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
            <Button variant="ghost" size="icon" className="mt-2 h-12 w-12 rounded-2xl bg-muted hover:bg-green-500/20 hover:text-green-500" aria-label="Create workspace">
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
