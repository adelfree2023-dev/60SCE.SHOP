# apex_testing_standard

**Focus**: Automated Unit & Integration Testing (Requirement 5).

---

## 🧪 Testing Protocols
- **Unit Testing**: Enforce mandatory unit tests for all business logic in `apps/api` and `packages/*`.
- **Integration Testing**: Test interdependencies between Drizzle repositories and services using test databases.
- **Edge Case Coverage**: Requirement to test for null pointers, empty arrays, and invalid tenant IDs.
- **Nuclear Testing**: High-intensity testing of critical paths (e.g., checkout, provisioning) using complex data sets.

## 🚀 Root Solutions
- **95% Coverage Gate**: No code is considered "complete" without a corresponding test file with at least 95% coverage on logic.
- **Mocks & Spies**: Utilize Bun's native testing framework (`bun:test`) with mocks for external services (Redis, Minio, Stripe).
- **Snapshot Testing**: Use for UI components in `apps/storefront`.
