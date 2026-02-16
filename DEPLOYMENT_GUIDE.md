# 🚀 Zero-Backend HMS - Deployment Guide

## 📋 **ONE-CLICK DEPLOYMENT FOR CLIENT DEMOS**

### **Option 1: Vercel Deploy (Recommended)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/indiclabsinfo-commits/sevasangrah-main)

**Steps:**
1. Click "Deploy" button above
2. Connect GitHub account
3. Select repository
4. **NO environment variables needed**
5. Deploy
6. Done! 🎉

### **Option 2: Manual Vercel Deploy**
```bash
# Clone repo
git clone https://github.com/indiclabsinfo-commits/sevasangrah-main.git
cd sevasangrah-main

# Deploy to Vercel
vercel
```

### **Option 3: Local Development**
```bash
git clone https://github.com/indiclabsinfo-commits/sevasangrah-main.git
cd sevasangrah-main
npm install
npm run dev
```

## 🔧 **CLIENT-SPECIFIC SETUP**

### **1. Create Supabase Project (for each client)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note: Project URL and Anon Key

### **2. Update Configuration**
Edit `src/config/supabaseConfig.ts`:
```typescript
export const SUPABASE_CONFIGS = {
  clientX: {
    url: 'https://client-x-supabase.supabase.co',
    anonKey: 'eyJhbGci...',
    projectName: 'Client X Hospital'
  }
};
```

### **3. Deploy with Client Config**
**URL Parameters:**
- `https://your-deploy.vercel.app?client=clientX`
- `https://your-deploy.vercel.app?client=magnus` (default)

### **4. Database Setup**
Run SQL migrations in Supabase SQL Editor:
```sql
-- Copy from database_migrations/ folder
-- Run each migration file in order
```

## 🏗️ **ARCHITECTURE**

### **Zero Backend Design**
- ✅ **No API server** - Frontend talks directly to Supabase
- ✅ **No environment variables** in Vercel
- ✅ **No database connections** to manage
- ✅ **Self-contained** deployment

### **Multi-Tenant Ready**
- One codebase, multiple Supabase projects
- Switch via URL parameter `?client=xxx`
- Isolated data per client

### **Authentication**
- Supabase Auth (if configured)
- Hardcoded fallback (demo mode)
- No JWT/server-side auth

## 📁 **FOLDER STRUCTURE**
```
src/
├── config/
│   └── supabaseConfig.ts    # Client configurations
├── lib/
│   └── supabaseClient.ts    # Auto-loading Supabase
├── services/
│   ├── authService.ts       # Zero-backend auth
│   └── supabaseHospitalService.ts  # Direct DB access
└── components/              # UI components
```

## 🔐 **LOGIN CREDENTIALS (Demo Mode)**

### **Hardcoded Users:**
1. **Admin:** `admin@hospital.com` / any password
2. **Doctor:** `doctor@hospital.com` / any password  
3. **Reception:** `reception@hospital.com` / any password

### **Supabase Auth (if configured):**
Use actual Supabase user accounts

## 🚨 **TROUBLESHOOTING**

### **OPD Queue Not Loading?**
1. Check Supabase project URL/key
2. Verify `patients` table has `queue_date`, `queue_status` columns
3. Check browser console for errors

### **Authentication Issues?**
1. Hardcoded auth always works (fallback)
2. For Supabase Auth: enable Auth in Supabase dashboard

### **Database Errors?**
1. Run migration scripts in Supabase SQL Editor
2. Check table permissions (RLS policies)

## 📞 **SUPPORT**

**For Client Demos:**
1. Deploy fresh instance per client
2. Use separate Supabase project per client
3. Share URL: `https://deploy.vercel.app?client=clientName`

**Development:**
- Branch: `zero-backend-architecture`
- No API dependencies
- Works anywhere

---

## 🎯 **DEMO CHECKLIST**

- [ ] Deploy to Vercel
- [ ] Test login (hardcoded auth works)
- [ ] Test OPD queue
- [ ] Test patient registration
- [ ] Test dashboard
- [ ] Share demo URL with client

**Demo URL Format:** `https://client-name-hms.vercel.app`

**Time to Demo:** **5 minutes** 🚀