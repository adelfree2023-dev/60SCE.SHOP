#!/bin/bash
set -e
cd ~/apex-v2

export SUBDOMAIN="acceptance-store-delivery-2"
export EMAIL="delivery2@example.com"

echo "--- TEST 1: Provisioning ---"
~/.bun/bin/bun scripts/provision-tenant.ts --store-name="$SUBDOMAIN" --owner-email="$EMAIL"

echo "--- TEST 3: Idempotency ---"
~/.bun/bin/bun scripts/provision-tenant.ts --store-name="$SUBDOMAIN" --owner-email="$EMAIL"

echo "--- TEST 4: Isolation ---"
docker exec apex-postgres psql -U apex -d apex -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'tenant_$SUBDOMAIN';"

echo "--- TEST 5: Audit ---"
docker exec apex-postgres psql -U apex -d apex -c "SELECT action, status FROM public.audit_logs WHERE tenant_id = '$SUBDOMAIN' ORDER BY created_at ASC;"
