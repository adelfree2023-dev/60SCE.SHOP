---
name: apex_phase_1_reference
description: Complete reference guide and lessons learned from Apex v2 Phase 1 implementation.
---

# 📚 Apex Phase 1 Reference Guide

**Status**: ✅ Complete (2026-01-30)  
**Pass Rate**: 100% (16/16 nuclear tests, 106/106 unit tests)  
**Purpose**: Knowledge base for Phase 2+ development

---

## 🎯 Phase 1 Achievement Summary

### Core Infrastructure (Arch-Core-01, Arch-Core-02)
- **Turborepo**: Build pipeline with caching (`turbo.json`)
- **Docker Stack**: 4 services operational
  - PostgreSQL with pgvector v0.5.1
  - Redis v7-alpine
  - MinIO (S3-compatible storage)
  - Traefik v3.0 (reverse proxy)

### Security Protocols (S0-S8) - 100% Compliance ✅
| Protocol | Implementation | Location | Tests |
|:---------|:--------------|:---------|:------|
| **S0** | Test Coverage >= 95% | All packages | 106/106 ✅ |
| **S1** | Environment Validation | `packages/config` | Zod schemas |
| **S2** | Tenant Isolation | `packages/db/middleware` | 7/7 ✅ |
| **S3** | Input Validation | Global `ZodValidationPipe` | 3/3 ✅ |
| **S4** | Audit Logging | Event interceptor | 2/2 ✅ |
| **S5** | Exception Filter | `GlobalExceptionFilter` | 2/2 ✅ |
| **S6** | Rate Limiting | `@nestjs/throttler` + Redis | 3/3 ✅ |
| **S7** | Encryption Service | `packages/encryption` | 7/7 ✅ |
| **S8** | Security Headers | `packages/security/helmet` | 8/8 ✅ |

### Super Admin Features
- **Super-#01**: Tenant Overview API (9/9 tests ✅)
- **Super-#21**: Blueprints Editor CRUD (8/8 tests ✅)

### Infrastructure Packages
- **@apex/redis**: Connection management, caching (8 tests)
- **@apex/storage**: MinIO integration (5 tests)
- **@apex/monitoring**: Sentry/GlitchTip (7 tests)

---

## 📁 Critical File Locations

### Configuration
```
turbo.json                          # Build pipeline
docker-compose.yml                  # Infrastructure stack
.env.example                        # Environment template
```

### Security Implementations
```
packages/config/                    # S1: Env validation
packages/db/middleware/             # S2: Tenant isolation
packages/provisioning/              # Provisioning engine
packages/encryption/                # S7: AES-256-GCM
packages/security/middlewares/      # S8: Helmet
```

### Super Admin
```
apps/api/src/modules/blueprints/    # Super-#21
apps/api/src/modules/tenants/       # Super-#01
```

### Test Suites
```
scripts/nuclear-test-phase-1.ts     # Comprehensive validation
scripts/verify-infrastructure.ts    # Quick health check
```

---

## 🔧 Common Commands

### Development
```bash
bun dev                             # Start all apps
bun test                            # Run all tests
bun test --coverage                 # With coverage report
```

### Infrastructure
```bash
docker-compose up -d                # Start all services
docker-compose ps                   # Check service status
docker exec apex-postgres psql ...  # Database access
```

### Verification
```bash
bun scripts/verify-infrastructure.ts    # Quick health check
bun scripts/nuclear-test-phase-1.ts    # Full validation
```

### Provisioning
```bash
bun scripts/provision-tenant.ts --store-name=test --owner-email=test@example.com
```

---

## 🐛 Lessons Learned (Critical Fixes Applied)

### 1. Audit Logging Parameter Binding
**Issue**: Using Drizzle's `sql` template caused "ghost parameters"  
**Solution**: Use `pool.query()` with explicit parameters  
**File**: `packages/provisioning/src/services/schema-creator.service.ts`

```typescript
// ❌ WRONG - caused ghost parameters
await this.db.execute(sql`INSERT INTO audit_logs VALUES (${x}, ${y})`);

// ✅ CORRECT - explicit parameter binding
await this.pool.query(
  'INSERT INTO audit_logs (user_id, action, tenant_id, duration, status) VALUES ($1, $2, $3, $4, $5)',
  ['system', action, tenantId, duration, 'success']
);
```

### 2. Test Coverage Gap
**Issue**: Constructor not tested in `TenantIsolationMiddleware`  
**Solution**: Added explicit test for static initialization  
**Learning**: Test all code paths including constructors

### 3. Traefik Permissions
**Issue**: `EACCES` error for dynamic routes directory  
**Solution**: `chown apex-v2-dev:apex-v2-dev infra/docker/traefik/dynamic`  
**Learning**: Verify file permissions after deployment

### 4. pgvector Extension
**Issue**: Standard postgres image lacks vector support  
**Solution**: Use `ankane/pgvector:latest` image  
**File**: `docker-compose.yml`

---

## 🧪 Testing Standards Established

### Unit Test Structure
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = { method: mock(() => Promise.resolve()) };
    service = new ServiceName(mockDependency);
  });

  it('should handle success case', async () => { /* ... */ });
  it('should handle error case', async () => { /* ... */ });
  it('should validate edge case', async () => { /* ... */ });
});
```

### Nuclear Test Categories
1. **Core Infrastructure** (6 tests): Docker services, extensions
2. **Security Protocols** (4 tests): S0-S8 compliance
3. **Super Admin** (2 tests): Feature APIs
4. **Infrastructure Packages** (3 tests): Redis, Storage, Monitoring
5. **Provisioning Engine** (1 test): End-to-end flow

---

## 📊 Performance Benchmarks

| Metric | Target | Achieved | Ratio |
|:-------|:-------|:---------|:------|
| Provisioning | < 55s | 0.08s | **687x** faster |
| Test Suite | - | 1.13s | Fast |
| Nuclear Test | - | 3.67s | Fast |

---

## 🚀 Phase 2 Preparation

### Dependencies Ready
- [x] Turborepo build system
- [x] Docker infrastructure
- [x] Security protocols enforced
- [x] Database with pgvector for AI features
- [x] Storage service (MinIO) for file uploads
- [x] Monitoring service for error tracking

### Next Steps
1. Tenant Storefront (Product catalog, cart, checkout)
2. Admin Panel (Inventory, orders, settings)
3. Payment Integration (Stripe Connect)
4. Email Notifications (Mailpit → SendGrid)

---

## ⚠️ Critical Reminders for Phase 2

### Always Follow S0 Protocol
- **Every** new `.ts` file needs `.spec.ts`
- **Minimum** 90% coverage per file
- **Zero exceptions** - this is non-negotiable

### Use Established Patterns
- Zod schemas for all DTOs
- `pool.query()` for audit logs (not `db.execute`)
- Mock dependencies in tests
- Verify on server, not just locally

### Nuclear Testing
- Add new tests to `nuclear-test-phase-1.ts` (or create Phase 2 version)
- Maintain 100% pass rate
- Run before every handover

---

## 📞 Quick Reference

**Test Coverage Command**:
```bash
bun test --coverage | grep "All files"
```

**Database Access**:
```bash
docker exec apex-postgres psql -U apex -d apex
```

**Redis Check**:
```bash
docker exec apex-redis redis-cli ping
# Expected: PONG
```

**MinIO Console**:
```
http://localhost:9001
User: admin
Pass: minio2026
```

---

*Last Updated*: 2026-01-30  
*Version*: Phase 1 Final  
*Status*: Production Ready ✅
