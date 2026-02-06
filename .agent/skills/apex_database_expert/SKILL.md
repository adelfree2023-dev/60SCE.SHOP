# apex_database_expert

**Focus**: Schema Migration Strategy & Database Optimization (Requirement 9).

---

## 🗄️ Database Protocols
- **Schema Design**: Enforce 3NF where appropriate, use JSONB for flexible tenant data.
- **Drizzle Integration**: Utilize Drizzle's migration toolchain for version-controlled schema updates.
- **Zero-Downtime Migrations**: Plan migrations using the "Expand and Contract" pattern (Add column -> Migrated data -> Remove old column).
- **Indexing**: Mandatory GIN indexes for JSONB search and B-Tree for tenant scoping.

## 🚀 Root Solutions
- **PGVector Support**: Specialized implementation of vector similarity search for products.
- **SQL Template Safety**: Prevent SQL injection by strictly using Drizzle's `sql` template literals.
- **Backup & Recovery**: Implementation of automated dump/restore strategies for tenant disaster recovery.
