export type Workspace = {
  id: string;
  name: string;
  logoUrl: string;
};

export type UserStatus = 'online' | 'offline' | 'away';

export type User = {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  status: UserStatus;
};

export type Channel = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  unreadCount: number;
  members: string[]; // array of user IDs
};

export type DirectMessage = {
  id: string;
  userId: string; // The other user in the DM
  lastMessageAt: string;
  unreadCount: number;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  users: string[]; // array of user IDs who reacted
};

export type Message = {
  id: string;
  channelId?: string;
  dmId?: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'code' | 'link';
  createdAt: string;
  reactions: MessageReaction[];
  attachment?: {
    name: string;
    url: string;
  };
};

export type PinnedMessage = {
  id: string;
  messageId: string;
  pinnedBy: string; // user ID
  createdAt: string;
};

export type File = {
  id: string;
  name: string;
  url: string;
  uploadedBy: string; // user ID
  createdAt: string;
  channelId?: string;
  dmId?: string;
};

export type Thread = {
  id: string;
  originalMessageId: string;
  messages: Message[];
  participants: string[]; // user IDs
};
