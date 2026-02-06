# 🧬 MULTI-TENANCY & ISOLATION (v1.0)

Cross-tenant data leakage is a **Fatal Security Violation**.

## 1. 🛡️ ISOLATION ARCHITECTURE
*   **Schema-Per-Tenant:** Every tenant gets its own dedicated PostgreSQL schema (`tenant_{uuid}`).
*   **Search Path:** Use `SET search_path = tenant_id, public` for every request.
*   **Isolation Integrity:** Test queries to ensure they CANNOT reach `tenant_b` data from `tenant_a` context.

## 2. 🚦 REQUEST SCOPING (The 2-Gate System)
*   **Gate 1 (Auth):** Validate JWT/Session. Is the user who they say they are?
*   **Gate 2 (Tenant):** Compare `user.tenantId` (from Token) vs `hostname` (from Request).
    *   **Mismatch = 403 Forbidden.** NO exceptions.
*   **Headers:** `X-Tenant-Id` must be strictly validated against the resolved scope.
*   **Guard:** `TenantScopedGuard` is MANDATORY for all protected routes.

## 3. 🔄 LIFECYCLE
*   Tenant creation MUST use the `ProvisioningService`.
*   **Automatic Setup:** DB Schema -> MinIO Bucket -> Redis Namespace.
