'use client';

import { X, Calendar, Mail, Phone, Hash } from 'lucide-react';
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
      setPanelTitle(`About #${channel.name}`);
      setContent(<ChannelDetailsPane channel={channel} members={members} />);
    } else if (isUser) {
      setPanelTitle('Profile');
      setContent(<UserDetailsPane user={conversation as User} />);
    } else {
      setPanelTitle('Details');
      setContent(<div className="p-4 text-sm text-muted-foreground">Select a conversation to see details.</div>);
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
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-96 border-l bg-background shadow-lg z-10"
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
