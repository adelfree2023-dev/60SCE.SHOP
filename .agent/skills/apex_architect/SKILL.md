---
name: apex_architect
description: Master of the Apex v2 Monorepo and LEGO-modular logic.
---

# 🏗️ Apex Architect Skill

Use this skill when designing new systems or refactoring the Monorepo.

## 🔷 Monorepo Strategy
- **Entry Points:** `apps/web` (Home), `apps/storefront` (Tenants), `apps/admin` (Dashboard).
- **Core Logic:** `packages/` should contain all logic shared across apps.
- **Rules:** Follow [Rules 1.1-1.4](file:///C:/Users/Dell/Desktop/New%20folder%20(2)/docs/Apex%20v2%20Engineering%20Constitution%20&%20Modular%20Protocol%20.md).

## 🔷 Implementation Steps
1. Define the Zod Schema.
2. Create the Database Migration.
3. Implement the Backend Module (NestJS).
4. Build the Frontend Components.
5. Verify with Vitest.
