-- MULTI-TENANT SAAS MIGRATION SCRIPT
-- HMS Project Consolidated Migration
-- Date: Jan 27, 2026

BEGIN;

-- 1. CREATE ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY DEFAULT 'org_' || lower(hex(randomblob(8))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE SUBSCRIPTIONS TABLE (Feature Flags)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY DEFAULT 'sub_' || lower(hex(randomblob(8))),
    org_id TEXT UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_opd_enabled BOOLEAN DEFAULT TRUE,
    is_ipd_enabled BOOLEAN DEFAULT FALSE,
    is_hrm_enabled BOOLEAN DEFAULT FALSE,
    is_tally_enabled BOOLEAN DEFAULT FALSE,
    is_pharma_enabled BOOLEAN DEFAULT FALSE,
    is_lab_enabled BOOLEAN DEFAULT FALSE,
    max_users INTEGER DEFAULT 10,
    max_beds INTEGER DEFAULT 20,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE DEFAULT ORGANIZATION (For Existing Data)
INSERT INTO public.organizations (id, name, slug) 
VALUES ('org_magnus_001', 'Magnus Hospital', 'magnus')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subscriptions (org_id, is_opd_enabled, is_ipd_enabled)
VALUES ('org_magnus_001', TRUE, TRUE)
ON CONFLICT (org_id) DO NOTHING;

-- 4. ADD ORG_ID TO ALL TABLES & MIGRATE DATA
DO $$
DECLARE
    t TEXT;
    tables_to_migrate TEXT[] := ARRAY[
        'User', 'Patient', 'Department', 'Appointment', 'Bill', 
        'AuditLog', 'DischargeSummary', 'DischargeBill', 
        'PatientAdmission', 'UhidConfig'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_migrate LOOP
        -- Check if column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = t AND column_name = 'org_id'
        ) THEN
            -- Add column as nullable first
            EXECUTE format('ALTER TABLE public."%s" ADD COLUMN org_id TEXT', t);
            
            -- Migrate existing data to default org
            EXECUTE format('UPDATE public."%s" SET org_id = ''org_magnus_001'' WHERE org_id IS NULL', t);
            
            -- Make column NOT NULL
            EXECUTE format('ALTER TABLE public."%s" ALTER COLUMN org_id SET NOT NULL', t);
            
            -- Add foreign key constraint
            EXECUTE format('ALTER TABLE public."%s" ADD CONSTRAINT fk_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id)', t);
        END IF;
    END LOOP;
END $$;

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
DO $$
DECLARE
    t TEXT;
    tables_to_protect TEXT[] := ARRAY[
        'User', 'Patient', 'Department', 'Appointment', 'Bill', 
        'AuditLog', 'DischargeSummary', 'DischargeBill', 
        'PatientAdmission', 'UhidConfig'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_protect LOOP
        EXECUTE format('ALTER TABLE public."%s" ENABLE ROW LEVEL SECURITY', t);
        
        -- Policy: Users can only see data for THEIR organization
        -- Assumes auth.jwt() contains org_id or we use a mapping function
        EXECUTE format('
            DROP POLICY IF EXISTS tenant_isolation_policy ON public."%s";
            CREATE POLICY tenant_isolation_policy ON public."%s"
            FOR ALL
            USING (org_id = (SELECT org_id FROM public."User" WHERE auth_id = auth.uid()));
        ', t, t);
    END LOOP;
END $$;

-- 6. SPECIAL POLICY FOR ORGANIZATIONS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own organization" ON public.organizations
FOR SELECT USING (id = (SELECT org_id FROM public."User" WHERE auth_id = auth.uid()));

COMMIT;
