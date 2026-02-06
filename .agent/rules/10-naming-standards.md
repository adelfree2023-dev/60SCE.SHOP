# 🔠 NAMING STANDARDS LAW (Pillar 2)

## 1. FILES & FOLDERS
*   **Kebab-Case:** ALL filenames must be `kebab-case.ts`.
    *   ✅ `place-order.use-case.ts`
    *   ❌ `PlaceOrder.ts`
*   **Suffixes:** Files must define their type.
    *   `.module.ts`, `.controller.ts`, `.service.ts`, `.entity.ts`

## 2. CLASSES & INTERFACES
*   **PascalCase:** All classes and interfaces.
    *   ✅ `OrderPlacedEvent`
    *   ❌ `orderPlacedEvent`
*   **Zod Schemas:** PascalCase + `Schema` suffix.
    *   ✅ `CreateUserSchema`

## 3. DATABASE
*   **Snake_Case:** All SQL tables and columns.
    *   ✅ `user_id`, `created_at`
*   **Plural:** Table names must be plural.
    *   ✅ `users`, `orders`

## 4. VARIABLES
*   **CamelCase:** Standard variables.
*   **UPPER_SNAKE:** Constants and Env Vars.
    *   ✅ `MAX_RETRY_COUNT`
