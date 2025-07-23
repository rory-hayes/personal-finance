/*
  # Authentication Setup and User Profiles
  
  1. Enable authentication
  2. Create user profiles table
  3. Update RLS policies for authenticated users
  4. Create functions for user management
*/

-- Enable authentication
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  household_size integer DEFAULT 1,
  monthly_income numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  timezone text DEFAULT 'UTC',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update existing tables to use proper user authentication

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow anonymous user creation" ON users;
DROP POLICY IF EXISTS "Allow anonymous user access" ON users;
DROP POLICY IF EXISTS "Allow anonymous user updates" ON users;
DROP POLICY IF EXISTS "Allow anonymous user deletion" ON users;

DROP POLICY IF EXISTS "Allow anonymous transaction access" ON transactions;
DROP POLICY IF EXISTS "Allow anonymous asset access" ON assets;
DROP POLICY IF EXISTS "Allow anonymous goal access" ON goals;
DROP POLICY IF EXISTS "Allow anonymous account access" ON accounts;
DROP POLICY IF EXISTS "Allow anonymous budget access" ON budgets;
DROP POLICY IF EXISTS "Allow anonymous budget category access" ON budget_categories;
DROP POLICY IF EXISTS "Allow anonymous vesting schedule access" ON vesting_schedules;
DROP POLICY IF EXISTS "Allow anonymous monthly summaries access" ON monthly_summaries;

-- Create new authenticated-only policies for users table
CREATE POLICY "Users can manage own data"
  ON users FOR ALL
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- Transactions policies
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Assets policies
CREATE POLICY "Users can manage own assets"
  ON assets FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Goals policies
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Accounts policies
CREATE POLICY "Users can manage own accounts"
  ON accounts FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Budgets policies
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Budget categories policies
CREATE POLICY "Users can manage own budget categories"
  ON budget_categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets 
    WHERE budgets.id = budget_categories.budget_id 
    AND budgets.user_id::text = auth.uid()::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets 
    WHERE budgets.id = budget_categories.budget_id 
    AND budgets.user_id::text = auth.uid()::text
  ));

-- Vesting schedules policies
CREATE POLICY "Users can manage own vesting schedules"
  ON vesting_schedules FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Monthly summaries policies
CREATE POLICY "Users can manage own monthly summaries"
  ON monthly_summaries FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Dashboard configurations policies (update existing)
DROP POLICY IF EXISTS "Allow all dashboard config access" ON dashboard_configurations;

CREATE POLICY "Users can manage own dashboard configs"
  ON dashboard_configurations FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update users table to use uuid references to auth.users
DO $$
BEGIN
  -- Add auth_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
  END IF;
END $$; 