-- Customer Portal Migration (Full Recovery + Multi-Tenant)
-- Document ID: APEX-CUSTOMER-PORTAL-2026-02-V2
-- This migration ensures base tables exist and creates all portal tables

-- ================================================================
-- 0. CLEANUP (Fix previous failed attempts)
-- ================================================================
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_messages CASCADE;

-- ================================================================
-- 1. GLOBAL SCHEMA (public)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'wallet_balance') THEN
        ALTER TABLE public.users ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- ================================================================
-- 2. TENANT SCHEMAS
-- ================================================================

DO $$ 
DECLARE 
    tenant_rec RECORD;
BEGIN 
    FOR tenant_rec IN SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' LOOP
        
        RAISE NOTICE 'Processing schema: %', tenant_rec.schema_name;

        -- 2.1 Ensure Base Tables Exist (Recovery for empty schemas on server)
        
        -- Products
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                stock INTEGER DEFAULT 0,
                images JSONB DEFAULT ''[]''::jsonb,
                status VARCHAR(50) DEFAULT ''published'',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )', tenant_rec.schema_name);

        -- Orders
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT ''pending'',
                total DECIMAL(10,2) NOT NULL DEFAULT 0,
                items JSONB NOT NULL DEFAULT ''[]''::jsonb,
                shipping_address JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )', tenant_rec.schema_name);

        -- 2.2 Create Customer Portal Tables

        -- Addresses
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.addresses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                label VARCHAR(50) NOT NULL,
                recipient_name VARCHAR(255) NOT NULL,
                phone VARCHAR(255) NOT NULL,
                street TEXT NOT NULL,
                building VARCHAR(50),
                floor VARCHAR(10),
                apartment VARCHAR(10),
                landmark TEXT,
                city VARCHAR(100) NOT NULL,
                postal_code VARCHAR(20),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )', tenant_rec.schema_name);

        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON %I.addresses(user_id)', tenant_rec.schema_name);

        -- Wallet Transactions
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.wallet_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL CHECK (type IN (''credit'', ''debit'', ''refund'')),
                amount DECIMAL(10, 2) NOT NULL,
                balance_after DECIMAL(10, 2) NOT NULL,
                description TEXT,
                reference_id UUID,
                reference_type VARCHAR(50),
                created_by UUID,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )', tenant_rec.schema_name);

        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON %I.wallet_transactions(user_id)', tenant_rec.schema_name);

        -- Wishlist
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.wishlist (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES %I.products(id) ON DELETE CASCADE,
                notify_on_sale BOOLEAN DEFAULT true,
                price_at_add DECIMAL(10, 2),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, product_id)
            )', tenant_rec.schema_name, tenant_rec.schema_name);

        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON %I.wishlist(user_id)', tenant_rec.schema_name);

        -- Support Tickets
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.support_tickets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                order_id UUID REFERENCES %I.orders(id) ON DELETE SET NULL,
                subject VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT ''open'' CHECK (status IN (''open'', ''pending'', ''resolved'', ''closed'')),
                priority VARCHAR(20) DEFAULT ''normal'' CHECK (priority IN (''low'', ''normal'', ''high'', ''urgent'')),
                assigned_to UUID,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                resolved_at TIMESTAMPTZ
            )', tenant_rec.schema_name, tenant_rec.schema_name);

        -- Ticket Messages
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.ticket_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ticket_id UUID NOT NULL REFERENCES %I.support_tickets(id) ON DELETE CASCADE,
                sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN (''customer'', ''merchant'')),
                sender_id UUID NOT NULL,
                message TEXT NOT NULL,
                attachment_url VARCHAR(500),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )', tenant_rec.schema_name, tenant_rec.schema_name);

    END LOOP;
END $$;
