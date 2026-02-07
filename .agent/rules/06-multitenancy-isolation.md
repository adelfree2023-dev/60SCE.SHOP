# 🧬 MULTI-TENANCY & ISOLATION (v1.0)

Cross-tenant data leakage is a **Fatal Security Violation**.

## 1. 🛡️ ISOLATION ARCHITECTURE
*   **Schema-Per-Tenant:** Every tenant gets its own dedicated PostgreSQL schema (`tenant_{uuid}`).
*   **Search Path:** Use `SET search_path = tenant_id, public` for every request.
*   **Isolation Integrity:** Test queries to ensure they CANNOT reach `tenant_b` data from `tenant_a` context.

## 2. 🚦 REQUEST SCOPING
*   **Header:** `X-Tenant-Id` (or Subdomain) must be validated in every request.
*   **Context:** Use NestJS Scoped Providers or `AsyncLocalStorage` to propagate the tenant ID.
*   **Guard:** Apply `TenantScopedGuard` to all routes except public landing pages.

## 3. 🔄 LIFECYCLE
*   Tenant creation MUST use the `ProvisioningService`.
*   **Automatic Setup:** DB Schema -> MinIO Bucket -> Redis Namespace.
