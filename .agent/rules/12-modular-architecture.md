# 🧱 MODULAR ARCHITECTURE LAW (The Lego Protocol)

## 1. 🏗️ MODULE ANATOMY (DDD)
*   **Structure:** Every module MUST contain:
    *   `domain/`: Entities & Value Objects (Pure Logic).
    *   `application/`: Use Cases (Orchestration).
    *   `infrastructure/`: Repositories & Adapters (I/O).
    *   `interfaces/`: Controllers & DTOs (Entry Points).
*   **Isolation:** Modules MUST NOT import from other modules directly. Use `packages/events` or defined Public APIs.

## 2. 🧩 FRONTEND ISLANDS
*   **Composition:** UI must be built as independent "Islands" (Micro-frontends concept).
*   **Independence:** A checkout component must work in isolation (storyboarding) without the full app context.

## 3. 🕸️ DEPENDENCY MAPPING
*   **Circular:** Zero circular dependencies allowed. `madge` check is mandatory.
*   **Extension-Centric:** All components must handle "Headless" interaction patterns for Browser Extensions.
