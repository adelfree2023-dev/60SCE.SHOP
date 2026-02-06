---
name: apex_provisioning_master
description: Manages the complex provisioning flow and tenant lifecycle for Apex v2.
---

# ⚡ Multi-Tenant Logic & Isolation (v2.0)

**Focus**: Multi-Tenant Logic Design (8).

---

## 🏗️ Multi-Tenant Protocols
- **Strict Data Isolation**: Enforce schema-based isolation using Drizzle and PostgreSQL `search_path`. Every tenant must operate within its own dedicated schema.
- **Tenant-Scoping**: Mandatory inclusion of `X-Tenant-Id` in all requests. Use `TenantContext` to propagate scoping across all service layers.
- **Blueprint System**: Standardize tenant onboarding using version-controlled blueprints to ensure consistency across the platform.

## 🚀 Root Solutions (Multi-Tenancy)
- **Zero-Cross-Leakage**: Implementation of rigorous tests to ensure one tenant can never access another tenant's data or resources.
- **Dynamic Provisioning**: Lifecycle management involving automatic DB schema creation, MinIO bucket isolation, and Redis namespace partitioning.
- **Tier-Based Gating**: Enforce feature availability and resource quotas based on the tenant's subscription tier.

## ⚖️ Governance Rule
No manual database edits. All tenant lifecycle operations (create, suspend, delete) must be executed through the audited `ProvisioningService`.
