-- 1. Ensure User Role Type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super-admin', 'tenant-admin');
    END IF;
END $$;

-- 2. Add missing legacy columns to tenants for migration (Handle existing data if any)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;

-- 3. Create Hardened Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT false,
    verification_token_hash VARCHAR(255),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    security_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Multi-tenant Email Protection
    UNIQUE (email, tenant_id)
);

-- 4. Partial Index for Super Admin Uniqueness (Postgres treats NULLs as non-unique)
CREATE UNIQUE INDEX IF NOT EXISTS unique_super_admin_email 
ON public.users (email) 
WHERE tenant_id IS NULL;

-- 5. Standard Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

-- 6. Migrate existing tenant admins if password hash exists
INSERT INTO public.users (email, password_hash, role, tenant_id, is_verified)
SELECT owner_email, admin_password_hash, 'tenant-admin'::user_role, id, true
FROM public.tenants
WHERE admin_password_hash IS NOT NULL
ON CONFLICT (email, tenant_id) DO NOTHING;
