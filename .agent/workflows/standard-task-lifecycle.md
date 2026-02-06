---
description: The mandatory lifecycle for every engineering task.
---

# 🧬 Standard Task Lifecycle (The Crucial Base)

**Philosophy**: "Write it. Test it. Review it. Ship it."

## 1. 📝 Phase 1: WRITE (Implementation)
*   **Spec First**: Ensure a `.spec.ts` file exists for the target component (per Rule 04).
*   **Implementation**: Write the code to satisfy the spec and requirements.
*   **Type Check**: Ensure strict strictness (no `any`).

## 2. 🧪 Phase 2: TEST (Verification)
*   **Unit Tests**: Run `bun test <file>.spec.ts`.
*   **Coverage**: Verify >90% coverage for the new code.
*   **Fix**: If tests fail, go back to Phase 1. DO NOT PROCEED.

## 3. 👁️ Phase 3: REVIEW (Certification)
*   **Self-Correction**: Review the code against `10-naming-standards.md` and `12-modular-architecture.md`.
*   **Linting**: Run `biome check` to ensure formatting and linting compliance.
*   **Final Output**: Confirm "Task Complete" only when tests pass and linter is green.
