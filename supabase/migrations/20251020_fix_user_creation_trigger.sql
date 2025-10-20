-- Fix user creation trigger function
-- This migration fixes the handle_new_user function to properly handle unique constraints

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function that handles unique constraints properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_handle TEXT;
  handle_counter INTEGER := 1;
BEGIN
  -- Generate a unique handle based on display_name or email
  user_handle := COALESCE(
    NEW.raw_user_meta_data->>'handle',
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9_]', '_', 'g'
    ))
  );
  
  -- Ensure handle is not empty
  IF user_handle = '' OR user_handle IS NULL THEN
    user_handle := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  
  -- Check for handle uniqueness and modify if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE handle = user_handle) LOOP
    user_handle := user_handle || '_' || handle_counter;
    handle_counter := handle_counter + 1;
  END LOOP;
  
  -- Insert user with proper error handling
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    user_handle,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    COALESCE(NEW.raw_user_meta_data->>'user_level', 'member'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper RLS policies exist
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_own_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_policy" ON users;
DROP POLICY IF EXISTS "users_select_workspace_policy" ON users;

-- Add INSERT policy for users table (allows trigger to insert)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

-- Add SELECT policy for users to see their own profile
CREATE POLICY "users_select_own_policy" ON users
  FOR SELECT USING (id = auth.uid());

-- Add UPDATE policy for users to update their own profile
CREATE POLICY "users_update_own_policy" ON users
  FOR UPDATE USING (id = auth.uid());

-- Add SELECT policy for users to see other users in their workspaces
CREATE POLICY "users_select_workspace_policy" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE user_id = users.id 
      AND workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for admin operations
CREATE POLICY "users_admin_policy" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_level IN ('super_admin', 'admin')
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ handle_new_user() function fixed and updated';
  RAISE NOTICE '✅ RLS policies updated for users table';
END $$;
