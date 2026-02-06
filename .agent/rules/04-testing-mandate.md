# 🧪 THE TESTING MANDATE (v1.0)

Code without tests is **Legacy Code** the moment it is written.

## 1. 🏁 COMPLETION CRITERIA (STRICT)
*   **The Golden Rule:** NO file (`.ts`, `.tsx`) shall be created without a corresponding `.spec.ts` file.
*   **Coverage Goal:** 90% strict line coverage is MANDATORY for all `packages/*` and `apps/api`.
*   **Blocker:** CI/CD will fail via `bun test --coverage --bail` if these criteria are not met.

## 2. 🧪 TESTING PROTOCOLS
*   **Framework:** Use `bun test` (vitest-compatible) exclusively.
*   **Mocks:** Use `mock` and `spyOn` from `bun:test` for Redis, Stripe, and Mailer.
*   **Database:** Use a dedicated test database for Integration Tests. Never run tests against production/dev schemas without cleanup logic.

## 3. ☢️ NUCLEAR TESTING
*   Critical paths (Checkout, Provisioning, Auth) MUST have "Nuclear" tests covering:
    *   Race conditions.
    *   Invalid/Cross-tenant ID attempts.
    *   Network timeouts (Simulator).
    *   Empty data/Null pointer attempts.
