# Login Troubleshooting Checklist

## Critical Steps - Have You Done All of These?

### ✅ Step 1: Saved Vercel Environment Variables
- [ ] Added ALL 7 variables to Vercel
- [ ] Clicked the **SAVE** button (bottom right)
- [ ] Each variable has ALL 3 checkboxes checked (Production, Preview, Development)

### ✅ Step 2: Redeployed Vercel
**CRITICAL:** Environment variable changes only take effect AFTER redeployment!

- [ ] Go to Vercel → **Deployments** tab
- [ ] Click **Redeploy** on latest deployment
- [ ] Wait for deployment to complete (should show green checkmark)

### ✅ Step 3: Created Admin User in Supabase
- [ ] Opened Supabase dashboard
- [ ] Clicked **SQL Editor** (left sidebar)
- [ ] Created new query
- [ ] Pasted and ran the admin user SQL
- [ ] Saw success message or query completed

### ✅ Step 4: Verify Frontend Points to Correct Backend
- [ ] Check what URL you're accessing for login
- [ ] Ensure it's your Vercel deployment URL (not localhost)

---

## What Error Are You Seeing?

Please tell me which error message you're getting:

**A)** "Invalid credentials" / "Login failed"
→ Admin user not created in Supabase

**B)** Network error / "Failed to fetch" / Connection timeout
→ Frontend pointing to wrong backend URL or Vercel not redeployed

**C)** 500 Internal Server Error
→ Database connection issue (env vars not set correctly)

**D)** Login button does nothing / page freezes
→ Frontend issue

---

## Quick Debug Steps

### 1. Check if Admin User Exists in Supabase
Run this in Supabase SQL Editor:

```sql
SELECT email, role, is_active FROM users WHERE email = 'admin@hospital.com';
```

**Expected:** Should return 1 row with admin@hospital.com
**If empty:** Admin user was not created - run the create admin SQL again

### 2. Test Backend Connection
Visit your Vercel deployment URL + `/api/health`:

```
https://your-app.vercel.app/api/health
```

**Expected:** `{"status":"healthy","database":"connected"}`
**If error:** Backend can't connect to Supabase (env vars issue or not redeployed)

### 3. Check Vercel Deployment Logs
1. Go to Vercel → Deployments
2. Click on latest deployment
3. Click **Functions** tab
4. Look for any error messages

---

## Most Common Issues:

### ❌ Issue 1: Forgot to Redeploy
**Solution:** Go to Vercel → Deployments → Click Redeploy

### ❌ Issue 2: Admin User Not Created
**Solution:** Run SIMPLE_CREATE_ADMIN.sql in Supabase SQL Editor

### ❌ Issue 3: Wrong Backend URL
**Solution:** Check your frontend code - what API URL is it using?
