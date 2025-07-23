/*
  # Fix Dashboard Configurations Table for Anonymous Users
  
  1. Remove foreign key constraint to users table that's causing 400 errors
  2. Make user_id a simple text field that can handle anonymous users
  3. Ensure anonymous access works properly
*/

-- Drop the existing foreign key constraint
ALTER TABLE dashboard_configurations 
DROP CONSTRAINT IF EXISTS dashboard_configurations_user_id_fkey;

-- Change user_id to text to handle anonymous users
ALTER TABLE dashboard_configurations 
ALTER COLUMN user_id TYPE text;

-- Update RLS policy to be more permissive for anonymous users
DROP POLICY IF EXISTS "Allow anonymous dashboard config access" ON dashboard_configurations;

CREATE POLICY "Allow all dashboard config access"
  ON dashboard_configurations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow public access for better compatibility
GRANT ALL ON dashboard_configurations TO anon;
GRANT ALL ON dashboard_configurations TO authenticated; 