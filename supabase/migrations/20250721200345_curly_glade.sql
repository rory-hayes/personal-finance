/*
  # Fix RLS policies for anonymous access

  1. Security Updates
    - Drop existing restrictive policies on all tables
    - Add policies allowing anonymous users to perform all operations
    - Enable anonymous access for assets, transactions, goals, and monthly_summaries tables

  2. Changes
    - Allow anonymous users to INSERT, SELECT, UPDATE, DELETE on all tables
    - Remove authentication requirements for MVP functionality
*/

-- Fix assets table policies
DROP POLICY IF EXISTS "Users can manage own assets" ON assets;

CREATE POLICY "Allow anonymous asset access"
  ON assets
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Fix transactions table policies  
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

CREATE POLICY "Allow anonymous transaction access"
  ON transactions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Fix goals table policies
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;

CREATE POLICY "Allow anonymous goal access"
  ON goals
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Fix monthly_summaries table policies
DROP POLICY IF EXISTS "Users can manage own monthly summaries" ON monthly_summaries;

CREATE POLICY "Allow anonymous monthly summaries access"
  ON monthly_summaries
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);