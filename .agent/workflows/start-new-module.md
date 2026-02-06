---
description: How to create a new Apex v2 Module from scratch.
---

# 🚀 Workflow: Start New Module

Follow these steps exactly to maintain "LEGO" modularity.

1. **Schema Check**
   - Check `packages/db/src/schema/` to see if entities already exist.
   - If not, create a new schema file and run `bun run db:generate`.

2. **Backend Scaffolding**
   - Run `nest g mo modules/[name]` in `apps/api`.
   - Create the DDD folders: `domain`, `application`, `infrastructure`, `interfaces`.

3. **Security Integration**
   - Apply `TenantScopedGuard` to the controller.
   - Inject the `AuditLogger` into the service.

4. **Frontend Integration**
   - Create shared UI components in `packages/ui` if reusable.
   - Implement the page/view in the target `apps/`.
   - Connect to the API using typed contracts.

5. **Validation**
   - Run `bun test` for the new module.
   - Check Linter: `bun run lint`.
