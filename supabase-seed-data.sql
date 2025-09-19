-- Seed data for testing
-- This will create sample workspaces, users, and channels

-- Insert sample workspaces
INSERT INTO workspaces (id, name, logo_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Product Team', 'https://placehold.co/40x40.png'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Marketing', 'https://placehold.co/40x40.png'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Engineering', 'https://placehold.co/40x40.png')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users (these will be linked to auth.users when they sign up)
INSERT INTO users (id, display_name, handle, avatar_url, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Alice Johnson', 'alice', 'https://i.pravatar.cc/40?u=alice', 'online'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Bob Smith', 'bob', 'https://i.pravatar.cc/40?u=bob', 'offline'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Charlie Brown', 'charlie', 'https://i.pravatar.cc/40?u=charlie', 'away'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Diana Prince', 'diana', 'https://i.pravatar.cc/40?u=diana', 'online'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Eve Wilson', 'eve', 'https://i.pravatar.cc/40?u=eve', 'online'),
  ('550e8400-e29b-41d4-a716-446655440015', 'Frank Miller', 'frank', 'https://i.pravatar.cc/40?u=frank', 'offline')
ON CONFLICT (id) DO NOTHING;

-- Insert workspace members
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
  -- Product Team members
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'owner'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'member'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 'member'),
  
  -- Marketing members
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014', 'owner'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', 'member'),
  
  -- Engineering members
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'owner'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015', 'member')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Insert sample channels
INSERT INTO channels (id, name, description, is_private, workspace_id, created_by) VALUES
  -- Product Team channels
  ('550e8400-e29b-41d4-a716-446655440020', 'general', 'General announcements and discussions', false, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440021', 'design-system', 'All about our design system', false, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440022', 'project-pegasus', 'Top secret project', true, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
  
  -- Marketing channels
  ('550e8400-e29b-41d4-a716-446655440023', 'campaign-launch', 'Campaign planning and execution', false, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014'),
  ('550e8400-e29b-41d4-a716-446655440024', 'social-media', 'Social media strategy and content', false, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014'),
  
  -- Engineering channels
  ('550e8400-e29b-41d4-a716-446655440025', 'backend-dev', 'Backend development discussions', false, '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440026', 'frontend-dev', 'Frontend development discussions', false, '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011')
ON CONFLICT (id) DO NOTHING;

-- Insert channel members
INSERT INTO channel_members (channel_id, user_id) VALUES
  -- General channel members (Product Team)
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440013'),
  
  -- Design System channel members
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013'),
  
  -- Project Pegasus (private) - only Alice and Bob
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011'),
  
  -- Marketing channels
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440014'),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440015'),
  
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014'),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440015'),
  
  -- Engineering channels
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440015'),
  
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440012')
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- Insert sample direct messages
INSERT INTO direct_messages (user1_id, user2_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440013'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440015')
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (id, content, type, author_id, channel_id, created_at) VALUES
  -- General channel messages
  ('550e8400-e29b-41d4-a716-446655440030', 'Welcome to the team! 🎉', 'text', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', NOW() - INTERVAL '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440031', 'Glad to be here! Thanks Alice', 'text', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440020', NOW() - INTERVAL '1 hour 55 minutes'),
  ('550e8400-e29b-41d4-a716-446655440032', 'Here is the new design mockup', 'image', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', NOW() - INTERVAL '1 hour 30 minutes'),
  ('550e8400-e29b-41d4-a716-446655440033', 'Looks great! I have some feedback', 'text', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440020', NOW() - INTERVAL '1 hour 25 minutes'),
  
  -- Design System channel messages
  ('550e8400-e29b-41d4-a716-446655440034', 'New component library is ready for review', 'text', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440021', NOW() - INTERVAL '3 hours'),
  ('550e8400-e29b-41d4-a716-446655440035', 'I''ll review it this afternoon', 'text', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440021', NOW() - INTERVAL '2 hours 30 minutes'),
  
  -- Backend Dev channel messages
  ('550e8400-e29b-41d4-a716-446655440036', 'API is down! 🔥', 'text', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '30 minutes'),
  ('550e8400-e29b-41d4-a716-446655440037', 'Working on it, should be back up in 10 min', 'text', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '25 minutes'),
  
  -- Campaign Launch channel messages
  ('550e8400-e29b-41d4-a716-446655440038', 'Q4 campaign planning starts tomorrow', 'text', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440023', NOW() - INTERVAL '4 hours'),
  ('550e8400-e29b-41d4-a716-446655440039', 'I''ve prepared the budget overview', 'text', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440023', NOW() - INTERVAL '3 hours 45 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert sample message reactions
INSERT INTO message_reactions (message_id, user_id, emoji) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440011', '🎉'),
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440012', '🎉'),
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440013', '🎉'),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440013', '👍'),
  ('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440011', '🔥'),
  ('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440012', '🔥')
ON CONFLICT (message_id, user_id, emoji) DO NOTHING;

-- Insert sample DM messages
INSERT INTO messages (id, content, type, author_id, dm_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', 'Hey Bob, do you have a minute?', 'text', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440041', 'Sure, what''s up?', 'text', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '55 minutes'),
  ('550e8400-e29b-41d4-a716-446655440042', 'Can you review the new API design?', 'text', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '50 minutes'),
  ('550e8400-e29b-41d4-a716-446655440043', 'Of course! Send it over', 'text', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;
