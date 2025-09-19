-- Fix user signup issues
-- This migration fixes the trigger function and policies for user creation

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the correct function that matches the table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    display_name,
    handle,
    avatar_url,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'handle', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add INSERT policy for users table
-- This allows the handle_new_user() trigger to insert new user records
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

-- Also add a policy to allow users to see their own profile
CREATE POLICY "users_select_own_policy" ON users
  FOR SELECT USING (id = auth.uid());

-- Add policy to allow users to update their own profile
CREATE POLICY "users_update_own_policy" ON users
  FOR UPDATE USING (id = auth.uid());

-- Add policy to allow users to see other users in their workspaces
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
