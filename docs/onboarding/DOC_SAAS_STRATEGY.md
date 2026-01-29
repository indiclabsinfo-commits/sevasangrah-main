# Multi-tenant SaaS Strategy: Vercel & Supabase

This document outlines how to implement a secure, scalable multi-tenant architecture using **Vercel** (Frontend) and **Supabase** (Backend/DB).

## Core Strategy: Hybrid Multi-Tenancy

We support two tiers of tenancy to balance cost and performance:
1.  **Pooled Tenancy (Free Tier / MVP)**: Multiple tenants share **ONE** Supabase project. Data is isolated using Row Level Security (RLS).
2.  **Siloed Tenancy (Enterprise)**: High-value clients get a **DEDICATED** Supabase project.

## How to Do It: Step-by-Step

### Phase 1: Vercel Setup (Frontend)

**Goal**: Map subdomains (e.g., `magnus.app.com`) to the same deployment.

1.  **Deploy Project**: Push your React app to Vercel.
2.  **Add Domains**:
    *   Go to **Settings > Domains**.
    *   **Pro Plan**: Add a wildcard domain `*.app.com`.
    *   **Free Plan**: You must manually add each domain:
        *   `magnus.app.com`
        *   `shreeji.app.com`
    *   Vercel will automatically route all these to your main application.
3.  **Handle Slug**: Use the `SaasContext` code (already implemented) to read `window.location.hostname` and extract the subdomain.

### Phase 2: Supabase Setup (Backend)

**Goal**: Prevent "Magnus" from seeing "Shreeji" data.

#### Option A: The "Free Tier" Approach (Pooled)
*Used for: MVP, Testing, Small Clinics*

1.  **Database Schema**: Ensure EVERY table has an `org_id` column.
    ```sql
    ALTER TABLE patients ADD COLUMN org_id uuid references public.organizations(id);
    ```
2.  **Enable RLS**: Turn on Row Level Security for every table.
    ```sql
    ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
    ```
3.  **Create Policy**:
    ```sql
    CREATE POLICY "Tenant Isolation" ON patients
    USING (org_id = (SELECT org_id FROM users WHERE auth_id = auth.uid()));
    ```
    *   *Result*: `SELECT * FROM patients` automatically returns ONLY the current user's organization data.

#### Option B: The "Enterprise" Approach (Siloed)
*Used for: Large Hospitals (e.g., Magnus, if they grow)*

1.  **New Project**: Create a fresh Supabase project `prominant-magnus-db`.
2.  **Env Config**: In Vercel, use Environment Variables to map slugs to API Keys.
    *   `VITE_API_URL_MAGNUS = https://magnus.supabase.co`
    *   `VITE_API_KEY_MAGNUS = eyJhb...`
3.  **Frontend Logic**: Update `saasService.ts` to pick the correct API URL based on the current slug.

## Summary Checklist
- [ ] Vercel: Add domain `magnus.app.com`
- [ ] Supabase: Add `org_id` to all tables
- [ ] Supabase: Enable RLS on all tables
- [ ] Migration: Run `MULTI_TENANT_MIGRATION.sql`
