-- [SECURITY REMEDIATION] NUC-202: Audit Log Immutability & Forensic Signatures
-- Targets: SEC-L4 Standard Compliance

-- 1. Add signature column if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='signature') THEN
        ALTER TABLE public.audit_logs ADD COLUMN signature TEXT;
    END IF;
END $$;

-- 2. Create/Update Immutability Trigger Function
CREATE OR REPLACE FUNCTION block_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE/DELETE operations are prohibited for SEC-L4 compliance.';
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Trigger
DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE PROCEDURE block_audit_modification();

-- 4. Verification Check
SELECT count(*) FROM information_schema.triggers WHERE event_object_table = 'audit_logs';
