---
name: apex_forensic_security
description: Security Architecture (SEC-L4) - Host-based isolation, SQL injection immunity, defense-in-depth patterns, and penetration testing protocols.
---

# APEX Forensic Security Skill (SEC-L4)

This skill encapsulates the security architecture competencies refined after the Jan-2026 remediation of critical findings.

## 1. Host-Based Tenant Isolation

### Architecture Principle
- **NEVER** use URL parameters for tenant identification
- **ALWAYS** derive tenant context from `X-Forwarded-Host` header (validated by Traefik)
- **REJECT** all requests with spoofed or missing host headers

### Implementation Pattern (TenantMiddleware)
```typescript
// ✅ CORRECT: Host-header-only context
const host = req.headers['x-forwarded-host'] || req.headers['host'];
const subdomain = extractSubdomain(host);
const tenant = await validateTenant(subdomain);
req.tenantId = tenant.id;
req.tenantSchema = `tenant_${tenant.id}`;

// ❌ WRONG: Never trust URL params
// const tenantId = req.params.tenantId; // VULNERABILITY!
```

### Verification Test
```bash
# This MUST return 403 Forbidden
curl -H "Host: evil-tenant.apex.localhost" https://victim.apex-v2.duckdns.org/api/storefront/home
```

## 2. SQL Injection Immunity

### Mandatory Patterns

#### For Dynamic Schema Identifiers
```typescript
// ❌ VULNERABLE
await db.execute(sql.raw(`CREATE TABLE "${schemaName}".products (...)`));

// ✅ SECURE: Use pg-format
import format from 'pg-format';
const query = format('CREATE TABLE %I.products (...)', schemaName);
await pool.query(query);
```

#### For Value Parameters
```typescript
// ❌ VULNERABLE
await db.execute(sql.raw(`SELECT * FROM products WHERE id = '${id}'`));

// ✅ SECURE: Parameterized queries
await db.execute(sql`SELECT * FROM products WHERE id = ${id}`);
```

### Verification Test
```bash
# All these MUST return 403 or validation error
curl "https://api.apex-v2.duckdns.org/tenants/' OR '1'='1"
curl "https://api.apex-v2.duckdns.org/tenants/'; DROP TABLE tenants; --"
```

## 3. Defense-in-Depth

### Layer 1: Global TenantScopeGuard
```typescript
// app.module.ts
{
    provide: APP_GUARD,
    useClass: TenantScopeGuard,
}
```

### Layer 2: Fail-Closed Rate Limiting
```typescript
// On Redis failure, BLOCK all requests (503)
catch (error) {
    throw new HttpException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Security infrastructure unavailable'
    }, HttpStatus.SERVICE_UNAVAILABLE);
}
```

### Layer 3: Immutable Audit Logging
```typescript
// Use dedicated connection pool targeting public.audit_logs
private static pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(`INSERT INTO public.audit_logs (...) VALUES (...)`);
```

## 4. Penetration Test Suite

### Required Tests (100% Pass Rate)
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| S2-1 | Invalid subdomain injection | 403 Forbidden |
| S2-2 | Nonexistent tenant access | 403 Forbidden |
| S2-3 | Cross-tenant data access | 403 Forbidden |
| S2-4 | SQL injection payloads | 403/400 Error |
| S6-1 | Rate limit burst attack | 429 after limit |
| S8-1 | XSS header injection | CSP blocks script |

### Execution Command
```bash
cd ~/apex-v2/scripts
bun run penetration-test.ts
```

## 5. PII Protection

### Mandatory Redaction Fields
```typescript
private static readonly PII_FIELDS = [
    'password', 'token', 'secret', 'apiKey', 'cvv', 'creditCard',
    'email', 'phone', 'address', 'fullName', 'firstName', 'lastName',
    'ssn', 'taxId', 'iban', 'routingNumber', 'accountNumber'
];
```

### Database Encryption Verification
```sql
SELECT owner_email FROM public.tenants LIMIT 1;
-- Expected: enc:db:... (encrypted, not plaintext)
```
