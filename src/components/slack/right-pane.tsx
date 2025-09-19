'use client';

import { X, Calendar, Mail, Phone, Hash, CornerDownRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Channel } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useCallback } from 'react';
import { useRightPane } from '@/hooks/use-right-pane';
import ChannelDetailsPane from './channel-details-pane';
import UserDetailsPane from './user-details-pane';
import ThreadsList from './threads-list';

interface RightPaneProps {
  conversation: Channel | User | undefined;
  users: User[];
}

export default function RightPane({ conversation, users }: RightPaneProps) {
  const { isOpen, setOpen, content, setContent, panelTitle, setPanelTitle } = useRightPane();

  const isChannel = conversation && 'isPrivate' in conversation;
  const isUser = conversation && !('isPrivate' in conversation);

  const updatePaneContent = useCallback(() => {
    if (isChannel) {
      const channel = conversation as Channel;
      const members = users.filter(u => channel.members.includes(u.id));
      setPanelTitle(`Threads - #${channel.name}`);
      setContent(<ThreadsList channelId={channel.id} workspaceId={channel.workspaceId} />);
    } else if (isUser) {
      setPanelTitle('Profile');
      setContent(<UserDetailsPane user={conversation as User} />);
    } else {
      setPanelTitle('Threads');
      setContent(<div className="p-4 text-sm text-muted-foreground">No channel selected. Select a channel to see threads.</div>);
    }
  }, [conversation, isChannel, isUser, setContent, setPanelTitle, users]);

  // Effect to update content when the main conversation changes
  useEffect(() => {
    updatePaneContent();
  }, [conversation, updatePaneContent]);

  // This allows the info button to reset the content to the current conversation
  const handleHeaderInfoClick = () => {
    updatePaneContent();
    setOpen(true);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-96 border-l bg-background shadow-lg flex-shrink-0"
          data-testid="right-pane"
        >
          <div className="flex h-full flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between p-4">
              <h3 className="text-lg font-bold">{panelTitle}</h3>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close details pane">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <Separator />
            <ScrollArea className="flex-1">
              {content}
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
