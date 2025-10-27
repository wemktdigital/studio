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
  user1_id: string;
  user2_id: string;
  created_at: string;
  // Campos computados para compatibilidade com UI
  otherUserId?: string; // ID do outro usuário (não o atual)
  lastMessageAt?: string;
  unreadCount?: number;
};

export type MessageReaction = {
  id: string;
  emoji: string;
  count: number;
  users: string[]; // array of user IDs who reacted
  hasReacted: boolean; // whether the current user has reacted
};

export type Message = {
  id: string;
  channelId?: string;
  dmId?: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'code' | 'link';
  createdAt: string;
  updatedAt?: string;
  reactions: MessageReaction[];
  attachment?: {
    name: string;
    url: string;
  };
  dataAiHint?: string;
  mentions?: MessageMention[];
  // 🔹 ADICIONADO: Dados do autor incluídos diretamente na mensagem
  // Isso permite que o nome e avatar apareçam imediatamente sem fazer consultas adicionais
  author?: User;
};

export type MessageMention = {
  id: string;
  messageId: string;
  mentionedUserId: string;
  mentionedByUserId: string;
  channelId?: string;
  dmId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  mentionedUser?: User;
  mentionedByUser?: User;
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
  channelId?: string;
  dmId?: string;
  title: string;
  participantCount: number;
  messageCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  participants: ThreadParticipant[];
};

export type ThreadMessage = {
  id: string;
  threadId: string;
  messageId: string;
  userId: string;
  parentMessageId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  parentMessage?: ThreadMessage;
};

export type ThreadParticipant = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  messageCount: number;
};

// Link Preview Types
export interface LinkPreview {
  url: string
  type: 'youtube' | 'github' | 'image' | 'document' | 'code' | 'generic'
  title?: string
  description?: string
  thumbnail?: string
  domain: string
  metadata?: Record<string, any>
}

export interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  type?: string
}
