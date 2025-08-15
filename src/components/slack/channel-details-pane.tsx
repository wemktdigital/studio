'use client';

import { Hash } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Channel } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { useRightPane } from '@/hooks/use-right-pane';
import UserDetailsPane from './user-details-pane';

const ChannelDetailsPane = ({ channel, members }: { channel: Channel, members: User[]}) => {
  const { setContent, setPanelTitle } = useRightPane();

  const handleUserClick = (user: User) => {
    setPanelTitle('Profile');
    setContent(<UserDetailsPane user={user} />);
  };

  return (
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
                <button key={member.id} onClick={() => handleUserClick(member)} className="flex w-full items-center gap-3 p-1 rounded-md hover:bg-muted text-left">
                  <UserAvatar user={member} />
                  <div className="flex flex-col">
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-xs text-muted-foreground">@{member.handle}</span>
                  </div>
                </button>
              ))}
            </div>
        </TabsContent>
        <TabsContent value="files">
            <p className="pt-4 text-sm text-muted-foreground">Files shared in this channel will be listed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ChannelDetailsPane;
