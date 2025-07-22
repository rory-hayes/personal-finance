/*
  # Add Budgeting System Tables

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `month` (date)
      - `total_budget` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `budget_categories`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key to budgets)
      - `category` (text)
      - `allocated_amount` (numeric)
      - `spent_amount` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `main_account_id` to users table
    - Add `is_main_account` to accounts table (simulated via existing structure)
    - Add `budget_category_id` to transactions table

  3. Security
    - Enable RLS on all new tables
    - Add policies for anonymous access (matching existing pattern)
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_budget numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount numeric DEFAULT 0,
  spent_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add main_account_id to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'main_account_id'
  ) THEN
    ALTER TABLE users ADD COLUMN main_account_id uuid;
  END IF;
END $$;

-- Add budget_category_id to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'budget_category_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN budget_category_id uuid REFERENCES budget_categories(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Allow anonymous budget access"
  ON budgets
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policies for budget_categories
CREATE POLICY "Allow anonymous budget category access"
  ON budget_categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_category ON transactions(budget_category_id);

-- Create unique constraint for user-month combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_user_id_month_key'
  ) THEN
    ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_month_key UNIQUE (user_id, month);
  END IF;
END $$;