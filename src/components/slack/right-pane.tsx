'use client';

import { X, Calendar, Mail, Phone, Hash } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Channel } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect } from 'react';
import { useRightPane } from '@/hooks/use-right-pane.tsx';

interface RightPaneProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Channel | User | undefined;
  users: User[];
  children?: React.ReactNode;
}

export default function RightPane({ isOpen, onClose, conversation, users, children }: RightPaneProps) {
  const { setContent } = useRightPane();
  const isChannel = conversation && 'isPrivate' in conversation;
  const isUser = conversation && !('isPrivate' in conversation);

  useEffect(() => {
    if (isChannel) {
        const channel = conversation as Channel;
        const members = users.filter(u => channel.members.includes(u.id));
        setContent(<ChannelDetailsPane channel={channel} members={members} />)
    } else if (isUser) {
        setContent(<UserDetailsPane user={conversation as User} />)
    } else {
        setContent(<div className="p-4 text-sm text-muted-foreground">Select a conversation to see details.</div>);
    }
  }, [conversation, isChannel, isUser, setContent, users]);


  const getTitle = () => {
    if (isChannel) return `About #${(conversation as Channel).name}`;
    if (isUser) return 'Profile';
    return 'Details';
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
              <h3 className="text-lg font-bold">{getTitle()}</h3>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details pane">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <Separator />
            <ScrollArea className="flex-1">
              {isChannel && (
                <ChannelDetailsPane channel={conversation as Channel} members={users.filter(u => (conversation as Channel).members.includes(u.id))} />
              )}
              {isUser && (
                <UserDetailsPane user={conversation as User} />
              )}
               {!conversation && (
                <div className="p-4 text-sm text-muted-foreground">Select a conversation to see details.</div>
               )}
              {children}
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ChannelDetailsPane = ({ channel, members }: { channel: Channel, members: User[]}) => (
  <div className="p-4">
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="about">
          <div className="pt-4 space-y-4 text-sm">
              <div>
                  <h4 className="font-bold mb-1">Channel Name</h4>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {channel.name}
                  </p>
              </div>
               {channel.description && (
                <div>
                    <h4 className="font-bold mb-1">Description</h4>
                    <p className="text-muted-foreground">{channel.description}</p>
                </div>
               )}
                <div>
                    <h4 className="font-bold mb-1">Created</h4>
                    <p className="text-muted-foreground">On July 30, 2024</p>
                </div>
          </div>
      </TabsContent>
      <TabsContent value="members">
          <div className="pt-4 space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-1 rounded-md hover:bg-muted">
                <UserAvatar user={member} />
                <div className="flex flex-col">
                    <span className="font-medium">{member.displayName}</span>
                    <span className="text-xs text-muted-foreground">@{member.handle}</span>
                </div>
              </div>
            ))}
          </div>
      </TabsContent>
      <TabsContent value="files">
          <p className="pt-4 text-sm text-muted-foreground">Files shared in this channel will be listed here.</p>
      </TabsContent>
    </Tabs>
  </div>
);

const UserDetailsPane = ({ user }: { user: User }) => (
  <div className="p-4 flex flex-col items-center text-center">
    <UserAvatar user={user} className="h-24 w-24 mt-4" />
    <h3 className="text-xl font-bold mt-4">{user.displayName}</h3>
    <p className="text-muted-foreground">@{user.handle}</p>
    <p className="text-sm my-2 capitalize p-1 px-2 rounded-full" >
        <span className={`inline-block h-2 w-2 rounded-full mr-1 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {user.status}
    </p>

    <Separator className="my-4" />

    <div className="w-full text-left text-sm space-y-3">
        <h4 className="font-bold mb-2">Contact Information</h4>
        <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.handle}@example.com</span>
        </div>
        <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>+1 (555) 123-4567</span>
        </div>
        <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Local time: 10:30 AM</span>
        </div>
    </div>
    
  </div>
);
