/*
  # Add vesting schedules table

  1. New Tables
    - `vesting_schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `monthly_amount` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `vesting_schedules` table
    - Add policy for anonymous access (matching existing pattern)

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on date range for vesting calculations
*/

CREATE TABLE IF NOT EXISTS vesting_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  monthly_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vesting_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous vesting schedule access"
  ON vesting_schedules
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vesting_schedules_user_id 
  ON vesting_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_vesting_schedules_dates 
  ON vesting_schedules(start_date, end_date);