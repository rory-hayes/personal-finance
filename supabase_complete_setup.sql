/*
  # Comprehensive Nudge Application Database Setup
  
  This script creates all necessary tables, indexes, RLS policies, and triggers
  for the Nudge personal finance application.
  
  Run this script in your new Supabase SQL editor to set up the complete database.
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_income numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  main_account_id uuid, -- References accounts table (added later)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies (Anonymous access for MVP)
CREATE POLICY "Allow anonymous user creation"
  ON users FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous user access"
  ON users FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous user updates"
  ON users FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous user deletion"
  ON users FOR DELETE TO anon USING (true);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  budget_category_id uuid, -- References budget_categories table (added later)
  rejected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Allow anonymous transaction access"
  ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- ASSETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Assets RLS Policies
CREATE POLICY "Allow anonymous asset access"
  ON assets FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- GOALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  target_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Goals RLS Policies
CREATE POLICY "Allow anonymous goal access"
  ON goals FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'main',
  balance numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Accounts RLS Policies
CREATE POLICY "Allow anonymous account access"
  ON accounts FOR ALL TO anon USING (true) WITH CHECK (true);

-- Add constraint for account types
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
  CHECK (type IN ('main', 'savings', 'investment', 'retirement', 'shares', 'other'));

-- =============================================
-- BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_budget numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Budgets RLS Policies
CREATE POLICY "Allow anonymous budget access"
  ON budgets FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- BUDGET CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount numeric DEFAULT 0,
  spent_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, category)
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Budget Categories RLS Policies
CREATE POLICY "Allow anonymous budget category access"
  ON budget_categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- VESTING SCHEDULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vesting_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  monthly_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  cliff_amount numeric DEFAULT NULL,
  cliff_period integer DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vesting_schedules ENABLE ROW LEVEL SECURITY;

-- Vesting Schedules RLS Policies
CREATE POLICY "Allow anonymous vesting schedule access"
  ON vesting_schedules FOR ALL TO anon USING (true) WITH CHECK (true);

-- Add constraint for cliff period (6 or 12 months)
ALTER TABLE vesting_schedules ADD CONSTRAINT vesting_schedules_cliff_period_check 
  CHECK (cliff_period IS NULL OR cliff_period IN (6, 12));

-- =============================================
-- MONTHLY SUMMARIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_income numeric DEFAULT 0,
  total_spending numeric DEFAULT 0,
  total_savings numeric DEFAULT 0,
  net_worth numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Monthly Summaries RLS Policies
CREATE POLICY "Allow anonymous monthly summaries access"
  ON monthly_summaries FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- ACCOUNT ALLOCATIONS TABLE
-- (Referenced in types but not yet implemented)
-- =============================================
CREATE TABLE IF NOT EXISTS account_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE account_allocations ENABLE ROW LEVEL SECURITY;

-- Account Allocations RLS Policies
CREATE POLICY "Allow anonymous account allocation access"
  ON account_allocations FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- CHAT MESSAGES TABLE
-- (Referenced in types for future AI features)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Messages RLS Policies
CREATE POLICY "Allow anonymous chat message access"
  ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- Add constraint for message types
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_type_check 
  CHECK (type IN ('user', 'assistant'));

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key constraint for users.main_account_id
ALTER TABLE users ADD CONSTRAINT users_main_account_id_fkey 
  FOREIGN KEY (main_account_id) REFERENCES accounts(id);

-- Add foreign key constraint for transactions.budget_category_id
ALTER TABLE transactions ADD CONSTRAINT transactions_budget_category_id_fkey 
  FOREIGN KEY (budget_category_id) REFERENCES budget_categories(id);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_main_account_id ON users(main_account_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_category ON transactions(budget_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);

-- Budget Categories indexes
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_category ON budget_categories(category);

-- Vesting Schedules indexes
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_user_id ON vesting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_dates ON vesting_schedules(start_date, end_date);

-- Monthly Summaries indexes
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month ON monthly_summaries(user_id, month);

-- Account Allocations indexes
CREATE INDEX IF NOT EXISTS idx_account_allocations_account_id ON account_allocations(account_id);
CREATE INDEX IF NOT EXISTS idx_account_allocations_date ON account_allocations(date);

-- Chat Messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- =============================================
-- CREATE UPDATE TRIGGERS
-- =============================================

-- Users update trigger
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Transactions update trigger
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Assets update trigger
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Goals update trigger
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Accounts update trigger
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Budgets update trigger
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Budget Categories update trigger
CREATE TRIGGER update_budget_categories_updated_at 
  BEFORE UPDATE ON budget_categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Vesting Schedules update trigger
CREATE TRIGGER update_vesting_schedules_updated_at 
  BEFORE UPDATE ON vesting_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Monthly Summaries update trigger
CREATE TRIGGER update_monthly_summaries_updated_at 
  BEFORE UPDATE ON monthly_summaries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Account Allocations update trigger
CREATE TRIGGER update_account_allocations_updated_at 
  BEFORE UPDATE ON account_allocations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert a default user (optional - your app creates this automatically)
-- INSERT INTO users (name, monthly_income, color) 
-- VALUES ('You', 0, '#3B82F6');

-- =============================================
-- SUMMARY
-- =============================================

/*
  Database setup complete! 

  Tables created:
  ✅ users - User profiles with income and settings
  ✅ transactions - Financial transactions with categorization
  ✅ assets - Asset tracking (property, vehicles, investments)
  ✅ goals - Financial goals with progress tracking
  ✅ accounts - Bank/financial accounts with balances
  ✅ budgets - Monthly budget planning
  ✅ budget_categories - Budget category allocations
  ✅ vesting_schedules - Equity/compensation vesting
  ✅ monthly_summaries - Aggregated monthly financial data
  ✅ account_allocations - Account allocation tracking
  ✅ chat_messages - Future AI chat functionality

  Features included:
  ✅ Row Level Security (RLS) policies for all tables
  ✅ Anonymous access policies (matching your app's design)
  ✅ Comprehensive indexes for performance
  ✅ Foreign key constraints for data integrity
  ✅ Check constraints for data validation
  ✅ Automatic timestamp updates via triggers
  ✅ Proper UUID primary keys
  ✅ Unique constraints where needed

  Your application should now connect seamlessly to this database!
*/ 