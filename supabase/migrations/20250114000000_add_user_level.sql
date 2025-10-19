-- Add user_level column to users table
-- This column manages user permission levels in the system

-- Add user_level column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'user_level'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN user_level TEXT DEFAULT 'member' 
    CHECK (user_level IN ('super_admin', 'admin', 'moderator', 'member', 'guest', 'viewer'));
    
    RAISE NOTICE 'Added user_level column to users table';
  ELSE
    RAISE NOTICE 'user_level column already exists';
  END IF;
END $$;

-- Update the handle_new_user trigger to include user_level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    display_name,
    handle,
    avatar_url,
    status,
    user_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'handle', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    COALESCE(NEW.raw_user_meta_data->>'user_level', 'member'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON COLUMN public.users.user_level IS 'User permission level: super_admin, admin, moderator, member, guest, or viewer';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ user_level column added successfully';
  RAISE NOTICE '✅ handle_new_user() function updated';
END $$;

