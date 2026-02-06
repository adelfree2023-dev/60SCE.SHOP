# 🔌 API STANDARDS LAW (v1.0)

## 1. REST PROTOCOL
*   **Strict Typing:** Request/Response bodies MUST be typed via NestJS DTOs and Zod.
*   **Normalization:** All responses MUST follow the standard envelope:
    ```json
    {
      "status": "success",
      "data": { ... },
      "meta": { "timestamp": 123456789 }
    }
    ```

## 2. VERSIONING
*   **URI Versioning:** Mandatory `/v1/`, `/v2/` prefix.
*   **Deprecation:** No breaking changes without a Major version bump.

## 3. DOCUMENTATION
*   **Auto-Docs:** Swagger/OpenAPI decorators are MANDATORY for every endpoint.
*   **Scalar:** Documentation is generated from code. Code is the single source of truth.

## 4. RATE LIMITING
*   **Throttling:** Redis-backed rate limiting is required for all public endpoints.
