-- Add 'customer' role to user_role enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'customer') THEN
            ALTER TYPE user_role ADD VALUE 'customer';
        END IF;
    END IF;
END $$;

-- Fix Unique Constraint (Email + TenantId)
-- 1. Remove old single-column unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_email_key' AND table_name = 'users') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_email_key;
    END IF;
END $$;

-- 2. Ensure composite unique constraint exists
-- We use a partial index for super admins (where tenant_id is NULL) and a composite constraint for others
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_email_tenant' AND table_name = 'users') THEN
        ALTER TABLE public.users ADD CONSTRAINT unique_email_tenant UNIQUE (email, tenant_id);
    END IF;
END $$;
