/*
  # Add cliff fields to vesting schedules

  1. Changes
    - Add `cliff_amount` column to store optional lump sum payment
    - Add `cliff_period` column to store cliff period in months (6 or 12)
    
  2. Security
    - No changes to RLS policies needed as they already cover all columns
*/

DO $$
BEGIN
  -- Add cliff_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vesting_schedules' AND column_name = 'cliff_amount'
  ) THEN
    ALTER TABLE vesting_schedules ADD COLUMN cliff_amount numeric DEFAULT NULL;
  END IF;
  
  -- Add cliff_period column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vesting_schedules' AND column_name = 'cliff_period'
  ) THEN
    ALTER TABLE vesting_schedules ADD COLUMN cliff_period integer DEFAULT NULL;
  END IF;
END $$;

-- Add check constraint to ensure cliff_period is either 6 or 12 months
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vesting_schedules_cliff_period_check'
  ) THEN
    ALTER TABLE vesting_schedules 
    ADD CONSTRAINT vesting_schedules_cliff_period_check 
    CHECK (cliff_period IS NULL OR cliff_period IN (6, 12));
  END IF;
END $$;