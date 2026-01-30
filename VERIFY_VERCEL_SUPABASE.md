# Vercel + Supabase Connection Verification Guide

## 1. Check Vercel Environment Variables

### Via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Verify these variables exist:
   - `AZURE_DB_HOST` = `db.xxx.supabase.co`
   - `AZURE_DB_PORT` = `5432`
   - `AZURE_DB_NAME` = `postgres`
   - `AZURE_DB_USER` = `postgres`
   - `AZURE_DB_PASSWORD` = (your Supabase password)
   - `JWT_SECRET` = (your secret key)
   - `DATABASE_URL` = (full PostgreSQL connection string)

### Important:
- Ensure variables are set for **Production**, **Preview**, and **Development** environments
- After updating, you MUST **redeploy** for changes to take effect

---

## 2. Test Database Connection from Supabase

### In Supabase SQL Editor:
```sql
-- Check if users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Check if admin user exists
SELECT id, email, first_name, last_name, role, is_active 
FROM users 
WHERE email = 'admin@hospital.com';

-- If admin doesn't exist, create it:
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'admin@hospital.com', 
    crypt('admin123', gen_salt('bf')), 
    'Admin', 
    'User', 
    'ADMIN',
    true
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = crypt('admin123', gen_salt('bf')), is_active = true;
```

---

## 3. Test Vercel Backend API

### Check if backend is running:
```bash
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
curl https://YOUR_VERCEL_URL.vercel.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@hospital.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN"
  }
}
```

**Error Responses:**
- `401 Invalid credentials` = Admin user not created or wrong password
- `500 Server error` = Database connection failed
- `Cannot GET /api/auth/login` = Wrong URL or backend not deployed

---

## 4. Check Vercel Deployment Logs

### Via Vercel Dashboard:
1. Go to your project in Vercel
2. Click on **Deployments**
3. Click on your latest deployment
4. Check the **Functions** tab for any errors
5. Look for runtime logs showing database connection errors

**Common Issues:**
- `ETIMEDOUT` = Database host incorrect or network issue
- `password authentication failed` = Wrong password in env vars
- `database "postgres" does not exist` = Wrong database name

---

## 5. Test from Browser Console

### Open your deployed app and run in browser console:
```javascript
fetch('https://YOUR_VERCEL_URL.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@hospital.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 6. Quick Verification Checklist

✅ **Supabase Setup:**
- [ ] Project created and accessible
- [ ] Database password known
- [ ] `users` table exists
- [ ] Admin user created with correct password hash

✅ **Vercel Setup:**
- [ ] Project connected to GitHub repo
- [ ] Environment variables set (all 6-7 required)
- [ ] Latest commit deployed
- [ ] Build successful (no errors)

✅ **Connection Test:**
- [ ] Can login from deployed app
- [ ] API endpoints respond correctly
- [ ] No timeout errors in logs

---

## 7. Common Issues & Fixes

### Issue: "Connection timeout"
**Fix:** Check `AZURE_DB_HOST` in Vercel env vars - should be `db.xxx.supabase.co` (NOT `xxx.supabase.co`)

### Issue: "Password authentication failed"
**Fix:** 
1. Reset database password in Supabase
2. Update `AZURE_DB_PASSWORD` in Vercel
3. Redeploy

### Issue: "Invalid credentials" when logging in
**Fix:** Run the admin user creation SQL in Supabase SQL Editor

### Issue: Changes not reflected
**Fix:** 
1. Check you updated the right environment (Production/Preview/Dev)
2. Trigger a new deployment after env var changes
3. Clear browser cache

---

## 8. Need More Help?

Run this debug endpoint (add to your server.js):
```javascript
app.get('/api/debug/connection', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW(), current_database(), current_user');
    res.json({
      success: true,
      timestamp: result.rows[0].now,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

Then visit: `https://YOUR_VERCEL_URL.vercel.app/api/debug/connection`
