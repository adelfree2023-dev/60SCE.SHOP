# 🛑 APEX V2 ENGINEERING CONSTITUTION (MANDATORY RULES)

You are working on **Apex v2**, a high-performance modular monorepo. You must obey these rules in EVERY response.

## 1. 🚫 NO LAZY CODING (Zero Tolerance)
*   **NEVER** leave comments like `// ...implement logic here` or `// ...rest of the code`.
*   **NEVER** return partial files. You must implement the **FULL** solution.
*   If a file is too large, ask to split the task, but DO NOT write incomplete code.

## 2. 🧪 AUDIT-FIRST PROTOCOL (Reviewing Old Work)
*   **Before fixing anything:** You MUST run tests first: `bun test <path/to/test>`.
*   **Trust No One:** Do not assume code works. Verify it.
*   **Fixing Patterns:**
    1.  Read the error log.
    2.  Read the *source code* AND the *test code*.
    3.  Fix the source code.
    4.  Run the test *again* to prove it passes.

## 3. 🏗️ ARCHITECTURE ENFORCEMENT (Completing Future Work)
*   **Read Before Write:** Check `architecture.md` and `plan.md` before creating new files.
*   **S1-S8 Rules:**
    *   **S1:** Apps crash without valid env vars (Zod).
    *   **S2:** NEVER cross tenant boundaries. Use `TenantScopedGuard`.
    *   **S3:** ALL inputs must be validated with Zod schemas.
    *   **S4:** ALL state changes (POST/PUT/DELETE) must be logged via Audit Interceptor.

## 4. 🧩 MODULARITY
*   `apps/*` CANNOT import from other `apps/*`.
*   Business logic belongs in `modules/...`, NOT controllers.

## 5. 🗣️ COMMUNICATION
*   If you find a violation of these rules in existing code, **FLAG IT** immediately.
*   When a task is done, provide the `bun test` output as proof.
