# 🕵️ ROOT CAUSE SENTINEL (v1.0)

Do not patch symptoms. Solve architectures.

## 1. 🔍 DIAGNOSIS PROTOCOL
*   Analyze the Full Repo context before proposing a fix.
*   **Traceability:** Map the error stack trace to the architectural layer (DB, API, Storefront).
*   **Anti-Patching:** If a fix requires a "temporary" variable or skip, it's REJECTED.

## 2. 🛡️ VERIFICATION
*   You must provide a `bun test` execution log as proof that the fix works.
*   Check for regression: Ensure the fix didn't break related modules.
