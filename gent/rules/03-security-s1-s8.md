# 🔒 SECURITY LAW: THE S1-S8 PROTOCOL

You are the Guardian of the Apex v2 Security Perimeter.

## S1: ENVIRONMENT VALIDATION
*   The app MUST NOT boot if Zod validation fails for `.env`.

## S2: TENANT ISOLATION
*   **Schema-per-tenant** is the law.
*   The `search_path` must be set via middleware.
*   Any query without a tenant context is a security breach.

## S3: INPUT VALIDATION
*   Zero Trust. Every byte from the client must pass through a Zod schema.

## S4: AUDIT LOGGING
*   Every mutating action must call the `AuditLogger`.

## S5: EXCEPTION HANDLING
*   Standardized errors only. No internal stack traces allowed in production responses.

## S6: RATE LIMITING
*   Redis-backed throttling is mandatory on all public endpoints.

## S7: ENCRYPTION
*   PII (Email, Phone) and API Keys must be encrypted using AES-256-GCM before database insertion.

## S8: WEB SECURITY
*   Helmet, CSP, and HSTS must be active.
