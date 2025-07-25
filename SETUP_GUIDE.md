# 🚀 **Nudge Setup Guide**

## **🚨 Critical Issue: Database Not Connected**

Your application is currently running without a database connection, which causes:
- ❌ Onboarding wizard hangs at Step 5
- ❌ Users can't complete registration 
- ❌ No data persistence
- ❌ Dashboard remains empty

## **⚡ Quick Fix for Testing**

If you just want to test the dashboard immediately:

1. **Emergency Bypass**: On the onboarding screen, click the orange "🚨 Temporary Bypass" button
2. This will skip onboarding and take you directly to the dashboard using local storage
3. ⚠️ **Note**: This is for testing only - no data will be saved permanently

## **🔧 Permanent Solution: Setup Supabase Database**

### **Step 1: Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose your organization
5. Fill in:
   - **Name**: `Nudge` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### **Step 2: Get Your Credentials**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public key** (long string starting with `eyJ`)

### **Step 3: Configure Environment Variables**

#### **For Local Development:**

1. Create a `.env` file in your project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Restart your development server:
```bash
npm run dev
```

#### **For Netlify Deployment:**

1. Go to your Netlify site dashboard
2. **Site Settings** → **Environment Variables**
3. Click **Add Variable** for each:
   - **Key**: `VITE_SUPABASE_URL`, **Value**: Your project URL
   - **Key**: `VITE_SUPABASE_ANON_KEY`, **Value**: Your anon key
4. Click **Deploy site** to rebuild with new variables

### **Step 4: Setup Database Schema**

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy and paste this complete database setup:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (for authentication)
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

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users table (for household members)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_income numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  balance numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  target_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Dashboard configurations table
CREATE TABLE IF NOT EXISTS dashboard_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  layout_config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow users to manage their own data)
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can manage own data" ON users FOR ALL TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own assets" ON assets FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own goals" ON goals FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own dashboard" ON dashboard_configurations FOR ALL TO authenticated USING (user_id = auth.uid());

-- Function to handle new user signup
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

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **Run** to execute the setup
5. You should see "Success. No rows returned" - this is normal!

### **Step 5: Test the Connection**

1. Go back to your application
2. Refresh the page
3. Try creating a new account
4. The onboarding should now complete successfully!

## **🔍 Troubleshooting**

### **Still seeing "Database Configuration Issue"?**

1. **Check Environment Variables**:
   - Verify they're set correctly (no typos)
   - For Netlify: Redeploy after setting variables
   
2. **Check Supabase URL**:
   - Should start with `https://`
   - Should end with `.supabase.co`
   
3. **Check Anon Key**:
   - Should be a long string starting with `eyJ`
   - Don't use the service_role key (that's for server-side only)

### **RLS (Row Level Security) Issues**?

If you see permission errors, the RLS policies might need adjustment. In Supabase SQL Editor:

```sql
-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
```

### **Still Need Help?**

1. Check browser console for detailed error messages
2. Check Supabase logs in **Logs** → **Database**
3. Verify your project is not paused in Supabase

## **📊 What You'll Get After Setup**

✅ **Working Onboarding**: Complete 5-step setup without hanging  
✅ **Data Persistence**: All your financial data saves properly  
✅ **Dashboard Cards**: Add and manage dashboard cards  
✅ **Account Management**: Track checking/savings accounts  
✅ **Real-time Updates**: Changes sync across sessions  
✅ **Secure Authentication**: Proper user management with Supabase Auth  

---

## **🎉 Success Checklist**

- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Database schema applied
- [ ] Application deployed/restarted
- [ ] Onboarding completes successfully
- [ ] Dashboard loads with default cards
- [ ] Can add/edit accounts, assets, goals

**Your Nudge is now fully functional! 🚀**