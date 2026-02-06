---
name: apex_server_operations
description: Advanced Server Operations (OPS-L3) - Zero-downtime deployment, forensic log analysis, secret rotation, and disaster recovery procedures.
---

# APEX Server Operations Skill (OPS-L3)

This skill encapsulates the operational competencies derived from the Jan-2026 Forensic Audit & SOP.

## 1. Zero-Downtime Deployment

### Rolling Update Protocol
```bash
# Scale up new containers first
docker compose up -d --no-deps --scale apex-api=2 apex-api

# Wait for health check (30 seconds)
sleep 30

# Verify new container is healthy
docker compose ps | grep apex-api

# Scale down to remove old container
docker compose up -d --no-deps --scale apex-api=1 apex-api
```

### Verification
```bash
# Continuous health check during deployment
while true; do curl -sf http://localhost:4000/health?skip_tenant_validation=1 && echo " OK" || echo " FAIL"; sleep 1; done
```

## 2. Forensic Log Analysis

### Attack Pattern Detection
```bash
# SQL Injection attempts
docker logs apex-api 2>&1 | grep -iE "union.*select|drop.*table|;.*--|or.*1.*=.*1"

# Cross-tenant violations
docker logs apex-api 2>&1 | grep -i "cross-tenant\|tenant context\|forbidden"

# Rate limit violations
docker logs apex-api 2>&1 | grep "Rate limit exceeded" | awk '{print $NF}' | sort | uniq -c | sort -rn | head 10
```

### Automated Hourly Scan
Create `/home/apex-v2-dev/apex-v2/scripts/security-scan.sh`:
```bash
#!/bin/bash
ERRORS=$(docker logs apex-api --since 1h 2>&1 | grep -cE "CRITICAL|SECURITY|AUDIT LOG FAILURE")
if [ "$ERRORS" -gt 0 ]; then
    echo "[ALERT] $(date): $ERRORS security events detected!"
fi
```

## 3. Secret Rotation Lifecycle

### Sentry DSN Rotation
1. Generate new key in Sentry Dashboard
2. Update environment: `sed -i 's|NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=NEW_DSN|g' .env`
3. Restart services: `docker compose restart apex-api apex-storefront`
4. Invalidate old key in Sentry Dashboard

### Database Password Rotation
```bash
docker exec apex-postgres psql -U apex -c "ALTER USER apex WITH PASSWORD 'NEW_PASSWORD';"
sed -i 's|OLD_PASSWORD|NEW_PASSWORD|g' .env
docker compose restart apex-api
```

### JWT Secret Rotation
> ⚠️ WARNING: This invalidates ALL active sessions!
```bash
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|g" .env
docker compose restart apex-api
```

## 4. Precision Disaster Recovery

### Full Database Backup
```bash
docker exec apex-postgres pg_dump -U apex -d apex -Fc > ~/backups/$(date +%Y%m%d)/apex_full.dump
```

### Tenant-Specific Backup
```bash
TENANT_ID="demo-store"
docker exec apex-postgres pg_dump -U apex -d apex --schema="tenant_${TENANT_ID}" -Fc > ~/backups/tenant_${TENANT_ID}.dump
```

### Tenant Restore (<5 minutes)
```bash
docker exec apex-postgres psql -U apex -d apex -c "DROP SCHEMA IF EXISTS tenant_${TENANT_ID} CASCADE;"
docker exec -i apex-postgres pg_restore -U apex -d apex < ~/backups/tenant_${TENANT_ID}.dump
```

## 5. Emergency Kill Switch

```bash
# Suspend malicious tenant immediately
curl -X PATCH http://localhost:4000/api/tenants/TENANT_ID/suspend
```
