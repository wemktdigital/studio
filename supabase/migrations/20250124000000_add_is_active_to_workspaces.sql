-- Add is_active column to workspaces table
-- This will allow workspaces to be activated/deactivated

-- Add the is_active column with a default value of true
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing workspaces to have is_active = true
UPDATE workspaces 
SET is_active = true 
WHERE is_active IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE workspaces 
ALTER COLUMN is_active SET NOT NULL;
