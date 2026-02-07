# 🔍 CLOUD & AI INNOVATION (v1.0)

Apex v2 is an AI-First platform. Search and Deployment must be intelligent.

## 1. 🧠 SEMANTIC SEARCH (pgvector)
*   **Vector Standard:** Use 1536 dimensions (OpenAI `text-embedding-ada-002` or `3-small`).
*   **Hybrid Logic:** Product search MUST combine Vector Similarity (70%) and Keyword tsvector (30%).
*   **Performance:** All vector columns must have an `HNSW` or `IVFFlat` index.

## 2. 🌩️ DOCKER & INFRASTRUCTURE
*   **Multi-Stage builds:** Mandatory. Final images must contain ONLY the compiled assets and node_modules.
*   **Bun Optimization:** Leverage `bun install --frozen-lockfile` in CI/CD.
*   **SSL:** Rely on Traefik ingress for automated Let's Encrypt wildcard certificates.

## 3. 🛡️ IDEMPOTENCY
*   All infrastructure and database scripts must be **Idempotent**. If they run twice, the result is the same.
