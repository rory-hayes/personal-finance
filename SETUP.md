# 🔧 BudgetTracker Setup Guide

## 🔐 Supabase Configuration

To get your app working, you need to configure your Supabase environment variables.

### Step 1: Create .env File

Create a `.env` file in the root directory (same level as package.json) with the following content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 2: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public key** → Use for `VITE_SUPABASE_ANON_KEY`

### Step 3: Update .env File

Replace the placeholder values in your `.env` file:

```bash
# Example - replace with your actual values
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run the Database Migration

Copy and paste the authentication SQL (provided separately) into your Supabase SQL editor and run it.

### Step 5: Restart Development Server

```bash
npm run dev
```

## ✅ Verification

If configured correctly:
- No console errors about Supabase
- You should see the authentication page
- Registration and login should work

## 🆘 Troubleshooting

- **Still seeing errors?** Check that your `.env` file is in the root directory
- **Auth not working?** Make sure you ran the database migration SQL
- **Can't find credentials?** Ensure you're looking at the correct Supabase project

---

Need help? The app will continue to work in mock mode until Supabase is configured. 