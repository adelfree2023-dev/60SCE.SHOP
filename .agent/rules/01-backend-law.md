# 🔧 BACKEND LAW: BUN + NESTJS + DRIZZLE

## 1. RUNTIME & PACKAGE MANAGEMENT
*   Use **Bun** (`bun`) for all commands (install, run, test).
*   Monorepo is managed by **Turborepo**.

## 2. NESTJS MODULE STRUCTURE
Every module MUST follow this exact structure:
```bash
src/
 ├── domain/        # Logic & Entities
 ├── application/   # Use Cases
 ├── infrastructure/# Persistence (Drizzle Repos)
 ├── interfaces/    # Controllers & DTOs
 └── [name].module.ts
```

## 3. DATABASE (DRIZZLE + POSTGRES)
*   **Schema Law:** Tables must be in `packages/db/src/schema`.
*   **Isolation:** All queries MUST include a `tenantId` filter or use the search-path middleware.
*   **pgvector:** Use vector search for all global discovery features.

## 4. TYPE SAFETY
*   `DTOs` must be classes decorated with `nestjs-zod`.
*   Interfaces must be derived from Zod schemas using `z.infer`.
