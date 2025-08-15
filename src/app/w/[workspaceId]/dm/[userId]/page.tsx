import React from 'react';
import { getMockData } from '@/lib/data';
import ChannelHeader from '@/components/slack/channel-header';
import MessageList from '@/components/slack/message-list';
import MessageComposer from '@/components/slack/message-composer';

export default function DMPage({
  params,
}: {
  params: { workspaceId: string; userId: string };
}) {
  // TODO: Replace with real data fetching from Firestore
  const { users, currentConversation, messages } = getMockData(params);

  return (
    <>
      <ChannelHeader conversation={currentConversation} />
      <MessageList messages={messages} users={users} />
      <MessageComposer conversation={currentConversation} />
    </>
  );
}
