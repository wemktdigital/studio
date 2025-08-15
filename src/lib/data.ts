import type { Workspace, User, Channel, DirectMessage, Message } from './types';

// TODO: Replace this mock data with Firestore streams

export const users: User[] = [
  { id: '1', displayName: 'Alice', handle: 'alice', avatarUrl: 'https://i.pravatar.cc/40?u=alice', status: 'online' },
  { id: '2', displayName: 'Bob', handle: 'bob', avatarUrl: 'https://i.pravatar.cc/40?u=bob', status: 'offline' },
  { id: '3', displayName: 'Charlie', handle: 'charlie', avatarUrl: 'https://i.pravatar.cc/40?u=charlie', status: 'away' },
  { id: '4', displayName: 'Diana', handle: 'diana', avatarUrl: 'https://i.pravatar.cc/40?u=diana', status: 'online' },
  { id: '5', displayName: 'Eve', handle: 'eve', avatarUrl: 'https://i.pravatar.cc/40?u=eve', status: 'online' },
  { id: '6', displayName: 'Frank', handle: 'frank', avatarUrl: 'https://i.pravatar.cc/40?u=frank', status: 'offline' },
];

export const workspaces: Workspace[] = [
  { id: '1', name: 'Product Team', logoUrl: 'https://placehold.co/40x40/76D9D1/3F3D56?text=P' },
  { id: '2', name: 'Marketing', logoUrl: 'https://placehold.co/40x40/3F3D56/FFFFFF?text=M' },
];

export const channels: Channel[] = [
  { id: '1', workspaceId: '1', name: 'general', description: 'General announcements and discussions', isPrivate: false, unreadCount: 3, members: ['1', '2', '3', '4', '5', '6'] },
  { id: '2', workspaceId: '1', name: 'design-system', description: 'All about our design system', isPrivate: false, unreadCount: 0, members: ['1', '3', '4'] },
  { id: '3', workspaceId: '1', name: 'backend-dev', isPrivate: false, unreadCount: 1, members: ['2', '5', '6'] },
  { id: '4', workspaceId: '1', name: 'project-pegasus', description: 'Top secret project', isPrivate: true, unreadCount: 0, members: ['1', '5'] },
  { id: '5', workspaceId: '2', name: 'campaign-launch', isPrivate: false, unreadCount: 5, members: ['1', '2', '4'] },
  { id: '6', workspaceId: '2', name: 'social-media', isPrivate: false, unreadCount: 0, members: ['4', '5'] },
];

export const dms: DirectMessage[] = [
    { id: '1', userId: '2', lastMessageAt: '2024-07-30T10:00:00Z', unreadCount: 1 },
    { id: '2', userId: '3', lastMessageAt: '2024-07-29T15:30:00Z', unreadCount: 0 },
    { id: '3', userId: '4', lastMessageAt: '2024-07-30T09:00:00Z', unreadCount: 0 },
    { id: '4', userId: '5', lastMessageAt: '2024-07-28T11:00:00Z', unreadCount: 2 },
    { id: '5', userId: '6', lastMessageAt: '2024-07-29T18:45:00Z', unreadCount: 0 },
];

export const messages: Message[] = [
  // Channel 1: general
  { id: '1', channelId: '1', authorId: '1', content: 'Welcome to the team!', type: 'text', createdAt: '2024-07-30T09:00:00Z', reactions: [{ emoji: '🎉', count: 3, users: ['2', '3', '4'] }] },
  { id: '2', channelId: '1', authorId: '2', content: 'Glad to be here!', type: 'text', createdAt: '2024-07-30T09:01:00Z', reactions: [] },
  { id: '3', channelId: '1', authorId: '1', content: 'Here is the new design mockup.', type: 'image', attachment: { name: 'mockup.png', url: 'https://placehold.co/600x400' }, dataAiHint: 'design mockup', createdAt: '2024-07-30T09:05:00Z', reactions: [{ emoji: '👍', count: 1, users: ['4'] }] },
  { id: '4', channelId: '1', authorId: '3', content: 'Looks great! I have some feedback.', type: 'text', createdAt: '2024-07-30T09:10:00Z', reactions: [] },
  { id: '5', channelId: '1', authorId: '4', content: 'Check out the new documentation: https://docs.example.com', type: 'link', createdAt: '2024-07-30T10:30:00Z', reactions: [] },
  { id: '6', channelId: '1', authorId: '5', content: 'Can someone help with this snippet?', type: 'code', content: `const greeting = () => {\n  console.log("Hello, world!");\n};`, createdAt: '2024-07-30T11:00:00Z', reactions: [{ emoji: '🤔', count: 1, users: ['6'] }] },
  
  // Channel 3: backend-dev
  { id: '7', channelId: '3', authorId: '6', content: 'API is down!', type: 'text', createdAt: '2024-07-30T14:00:00Z', reactions: [{ emoji: '🔥', count: 2, users: ['2', '5'] }] },

  // DM with Bob (user 2)
  { id: '8', dmId: '1', authorId: '1', content: 'Hey Bob, do you have a minute?', type: 'text', createdAt: '2024-07-30T10:00:00Z', reactions: [] },
  { id: '9', dmId: '1', authorId: '2', content: 'Sure, what\'s up?', type: 'text', createdAt: '2024-07-30T10:01:00Z', reactions: [] },
];

export const getMockData = (params: { workspaceId: string, channelId?: string, userId?: string }) => {
  const workspace = workspaces.find(w => w.id === params.workspaceId);
  const currentChannels = channels.filter(c => c.workspaceId === params.workspaceId);
  const otherUsers = users.filter(u => u.id !== '1'); // Assuming current user is Alice (id: 1)
  
  let currentConversation: Channel | User | undefined;
  let conversationMessages: Message[] = [];
  
  if (params.channelId) {
    currentConversation = channels.find(c => c.id === params.channelId);
    conversationMessages = messages.filter(m => m.channelId === params.channelId);
  } else if (params.userId) {
    currentConversation = users.find(u => u.id === params.userId);
    const dm = dms.find(d => d.userId === params.userId);
    if(dm) {
        conversationMessages = messages.filter(m => m.dmId === dm.id);
    }
  }

  // TODO: Replace with real data fetching
  return {
    workspaces,
    users,
    currentWorkspace: workspace,
    channels: currentChannels,
    dms,
    currentConversation,
    messages: conversationMessages,
  }
}
