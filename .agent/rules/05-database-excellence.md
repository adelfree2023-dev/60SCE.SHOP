# 🗄️ DATABASE EXCELLENCE (v1.0)

The Database is the source of truth. Integrity is absolute.

## 1. 🛠️ DRIZZLE STANDARDS
*   **Schema Location:** `packages/db/src/schema/`.
*   **Safety:** `sql` template literals are MANDATORY for raw queries to prevent Injection.
*   **Migrations:** All schema changes must be versioned via `drizzle-kit generate`.
*   **Zero-Downtime:** "Expand and Contract" pattern for all schema changes.

## 2. 📐 ARCHITECTURAL STANDARDS
*   **Normal Form:** 3NF for relational data.
*   **Flexibility:** Use `jsonb` for dynamic store settings (Metadata/Branding).
*   **Indexes:**
    *   **B-Tree:** Mandatory for `tenantId` and `id` columns.
    *   **GIN:** Mandatory for full-text search and JSONB fields.
    *   **HNSW/IVFFlat:** Mandatory for `pgvector` columns.

## 3. 🚀 MIGRATION PROTOCOL
*   **Expand & Contract:**
    1.  Add new column/table.
    2.  Write migration script to move data.
    3.  Verify in code.
    4.  Remove old column/table in follow-up task.
