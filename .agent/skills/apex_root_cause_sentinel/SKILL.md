---
name: apex_root_cause_sentinel
description: Anti-laziness protocol focusing on formal verification and elimination of temporary patches.
---

# 🕵️ Context-Aware Debugging & Error Handling (v2.0)

**Focus**: Context-Aware Debugging (3) & Error Handling Patterns (16).

---

## 🔍 Context-Aware Debugging
- **Full-Repo Awareness**: Analyze errors using the entire project context. Never fix a local symptom without checking its global architectural impact.
- **Traceability Matrix**: Map errors to specific architectural layers (e.g., "The Redis timeout in the Storefront is caused by a missing connection pool in the API layer").

## 🚀 Root Solutions (Error Handling)
- **Global Resilience**: Implement global, resilient error-capturing systems using NestJS Exception Filters and AsyncLocalStorage for request tracing.
- **Standardized Payloads**: All errors must return a consistent JSON payload: `{ status: "error", code: "E_CODE", message: "User-friendly message", details: {...} }`.
- **Automatic Recovery**: Design systems to automatically recover from transient failures (e.g., Redis reconnection, DB retry logic).

## 🛡️ Anti-Hallucination Protocols
- **Proof of Fix**: You must trace any proposed fix to a specific line in the codebase. Refuse to guess.
- **Verification Mapping**: Confirm the fix on the server by running targeted tests or checking live logs.
