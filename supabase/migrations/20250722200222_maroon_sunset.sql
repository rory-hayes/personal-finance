/*
  # Add cliff columns to vesting_schedules table

  1. Changes
    - Add `cliff_amount` column to store the cliff payment amount
    - Add `cliff_period` column to store the cliff period in months (6 or 12)

  2. Security
    - No changes to existing RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vesting_schedules' AND column_name = 'cliff_amount'
  ) THEN
    ALTER TABLE vesting_schedules ADD COLUMN cliff_amount numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vesting_schedules' AND column_name = 'cliff_period'
  ) THEN
    ALTER TABLE vesting_schedules ADD COLUMN cliff_period integer DEFAULT NULL;
  END IF;
END $$;