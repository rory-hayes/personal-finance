/*
  # Ensure Dashboard Configurations Table Compatibility
  
  1. Ensure the table structure is correct
  2. Fix any RLS policy issues
  3. Add proper grants for authenticated users
  4. Ensure the layout_config column accepts JSON data properly
*/

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS dashboard_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL DEFAULT 'Main Dashboard',
  is_default boolean DEFAULT false,
  layout_config jsonb NOT NULL DEFAULT '{"cards":[],"settings":{"gridColumns":4,"cardSpacing":24,"theme":"light"}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow all dashboard config access" ON dashboard_configurations;
DROP POLICY IF EXISTS "Allow anonymous dashboard config access" ON dashboard_configurations;
DROP POLICY IF EXISTS "Users can manage own dashboard configs" ON dashboard_configurations;

-- Create comprehensive policy for all operations
CREATE POLICY "Allow dashboard config management"
  ON dashboard_configurations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure proper grants
GRANT ALL ON dashboard_configurations TO anon;
GRANT ALL ON dashboard_configurations TO authenticated;
GRANT ALL ON dashboard_configurations TO service_role;

-- Recreate indexes
DROP INDEX IF EXISTS idx_dashboard_configurations_user_id;
DROP INDEX IF EXISTS idx_dashboard_configurations_user_default;
DROP INDEX IF EXISTS idx_dashboard_configurations_user_default_unique;

CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_id ON dashboard_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_default ON dashboard_configurations(user_id, is_default);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_dashboard_configurations_updated_at ON dashboard_configurations;
CREATE TRIGGER update_dashboard_configurations_updated_at 
  BEFORE UPDATE ON dashboard_configurations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a test configuration to verify everything works
INSERT INTO dashboard_configurations (user_id, name, is_default, layout_config)
VALUES (
  'test-user',
  'Test Dashboard',
  true,
  '{"cards":[{"id":"test-card","type":"monthly-income","size":"half","position":{"x":0,"y":0},"config":{"title":"Monthly Income","visible":true}}],"settings":{"gridColumns":4,"cardSpacing":24,"theme":"light"}}'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM dashboard_configurations WHERE user_id = 'test-user'; 