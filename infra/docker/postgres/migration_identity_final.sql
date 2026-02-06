-- 1. DROP old users table to ensure clean state with correct constraints
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Ensure User Role Type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super-admin', 'tenant-admin');
    END IF;
END $$;

-- 3. Create Users Table with constraints
CREATE TABLE public.users (
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
    UNIQUE (email, tenant_id)
);

-- 4. Partial Unique Index for Super Admin Uniqueness
CREATE UNIQUE INDEX unique_super_admin_email 
ON public.users (email) 
WHERE tenant_id IS NULL;

-- 5. Standard Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);

-- 6. Migrate existing tenant info
INSERT INTO public.users (email, password_hash, role, tenant_id, is_verified)
SELECT owner_email, admin_password_hash, 'tenant-admin'::user_role, id, true
FROM public.tenants
WHERE admin_password_hash IS NOT NULL;
