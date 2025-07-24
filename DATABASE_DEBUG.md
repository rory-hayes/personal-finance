# 🔍 **Database Connectivity Debug Guide**

## **Current Issue Analysis**

Based on your logs, the application has:
- ✅ **Supabase environment variables configured** (mock mode = false)
- ❌ **Database operations timing out** after 30 seconds
- ❌ **Profile loading failing** (showing "Loading dashboard..." indefinitely)
- ❌ **Host resolution failure** (`ewdbxufcmqlzmifkkqkx.supabase.co`)

## **🚨 Immediate Checks**

### **1. Verify Environment Variables**

Open your browser's **Developer Tools** → **Console** and check:

```javascript
// In browser console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

**Expected output:**
- URL: `https://[project-id].supabase.co`
- Key: `eyJhbGciOiJIUzI1NiI...` (starts with `eyJ`)

### **2. Test Direct Connection**

Try this in your browser console:
```javascript
// Test basic connectivity
fetch('https://ewdbxufcmqlzmifkkqkx.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGJ4dWZjbXFsem1pZmtrcWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2MzE3NTcsImV4cCI6MjA1MzIwNzc1N30.qRAVwKsGPwm-dXLQZd6CX4FWr7ZFVZgNdz5N_yZdKIE'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Connection successful:', d))
.catch(e => console.error('❌ Connection failed:', e));
```

## **🔧 Common Fixes**

### **Issue 1: Invalid Supabase URL**

**Symptoms:** Host resolution failures, connection timeouts
**Solution:** 
1. Check your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the correct **Project URL**
4. Update environment variables

### **Issue 2: Wrong API Key**

**Symptoms:** 401 Unauthorized errors
**Solution:**
1. Use the **anon public** key, NOT the service_role key
2. Key should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### **Issue 3: Database Schema Missing**

**Symptoms:** Table doesn't exist errors
**Solution:** Run this SQL in Supabase SQL Editor:

```sql
-- Check if user_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);

-- If false, create the table:
CREATE TABLE user_profiles (
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

-- Add policy
CREATE POLICY "Users can manage own profile" 
ON user_profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id);
```

### **Issue 4: RLS Policy Problems**

**Symptoms:** Permission denied errors
**Solution:** Temporarily disable RLS for testing:

```sql
-- TEMPORARY FIX - DO NOT USE IN PRODUCTION
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

### **Issue 5: Network/CORS Issues**

**Symptoms:** CORS errors, network failures
**Solution:**
1. Check if you're accessing the app via `localhost` or the correct domain
2. Verify Supabase project isn't paused
3. Check firewall/antivirus blocking connections

## **⚡ Quick Test Commands**

### **Test 1: Environment Variables**
```bash
# In your project terminal:
echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY"
```

### **Test 2: Table Existence**
```sql
-- In Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Test 3: RLS Status**
```sql
-- Check RLS status:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
```

## **🆘 Emergency Bypass**

If nothing works, use the **temporary bypass**:

1. **On the onboarding screen**, look for the red warning box
2. **Click "🚨 Temporary Bypass (Testing Only)"**
3. This will skip database operations and use localStorage
4. **You can then test the dashboard functionality**

## **📞 Get Help**

If you're still stuck, provide these details:

1. **Environment Variable Status** (from browser console)
2. **Network Tab** errors (in Developer Tools)
3. **Supabase Project Status** (active/paused)
4. **Console Logs** during onboarding attempt

## **✅ Success Indicators**

You'll know it's working when:
- ✅ Onboarding completes without timeout
- ✅ Dashboard loads with data
- ✅ Profile information persists
- ✅ No console errors about database connections

---

**Next Steps:** Try the fixes above in order, and let me know which one resolves the issue! 