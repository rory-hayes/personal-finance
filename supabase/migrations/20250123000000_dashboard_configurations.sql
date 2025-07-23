/*
  # Dashboard Configurations Table
  
  1. New Tables
    - `dashboard_configurations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text) - Dashboard name like "Main", "Investment Focus", etc.
      - `is_default` (boolean) - Whether this is the user's default dashboard
      - `layout_config` (jsonb) - Stores the complete dashboard layout configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `dashboard_configurations` table
    - Add policy for anonymous access (matching existing pattern)

  3. Layout Config JSON Structure:
    {
      "cards": [
        {
          "id": "monthly-income",
          "type": "metric",
          "size": "quarter", // quarter, half, full, tall
          "position": { "x": 0, "y": 0, "w": 1, "h": 1 },
          "config": {
            "title": "Monthly Income",
            "chartType": "number", // number, bar, line, pie, etc.
            "timeRange": "current", // current, 6months, 12months, custom
            "visible": true
          }
        }
      ],
      "settings": {
        "gridColumns": 4,
        "cardSpacing": 24,
        "theme": "light"
      }
    }
*/

CREATE TABLE IF NOT EXISTS dashboard_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Main Dashboard',
  is_default boolean DEFAULT false,
  layout_config jsonb NOT NULL DEFAULT '{"cards":[],"settings":{"gridColumns":4,"cardSpacing":24,"theme":"light"}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anonymous dashboard config access"
  ON dashboard_configurations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_id ON dashboard_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_default ON dashboard_configurations(user_id, is_default);

-- Unique constraint: Only one default dashboard per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_configurations_user_default_unique 
  ON dashboard_configurations(user_id) 
  WHERE is_default = true;

-- Update trigger
CREATE TRIGGER update_dashboard_configurations_updated_at 
  BEFORE UPDATE ON dashboard_configurations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 