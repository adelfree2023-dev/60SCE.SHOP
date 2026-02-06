# 🏗️ Apex v2: Modern Secure Multi-Tenant Architecture (2026 Edition)

This document outlines the architectural blueprint, technology stack, and security protocols for the **Apex v2 Greenfield Project**.

---

## 🚀 1. Technology Stack (The "Power" Stack)

We are adopting a cutting-edge, performance-oriented stack optimized for 2026 standards.

### Core Infrastructure
| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Runtime** | **Bun** ⚡ | 3x faster startup/install than Node.js. Native TypeScript support. |
| **Monorepo Manager** | **Turborepo** 📦 | Intelligent build caching. Manage Front/Back in one repo. |
| **Containerization** | **Docker** 🐳 | Standardized environments (Dev/Prod). |
| **API Gateway** | **Traefik** 🚦 | Dynamic load balancing & automated SSL. |

### Backend & Data
| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Framework** | **NestJS** 🛡️ | Enterprise-grade structure, perfect for enforcing S1-S8 security. |
| **Database** | **PostgreSQL** + **pgvector** 🧠 | Relational data + AI Embeddings support. |
| **ORM** | **Drizzle** 🌧️ | Lightweight, Serverless-ready, fully typed, Bun-compatible. |
| **Caching/Queue** | **Redis** 🚀 | High-performance Rate Limiting & Session management. |
| **File Storage** | **MinIO** 🗄️ | Self-hosted S3-compatible object storage (Avatars, Docs). |

### Frontend
| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** 🖥️ | React 19, Server Actions, Hybrid Rendering. |
| **State Management** | **Zustand** 🐻 | Minimalist, predictable state management (vs Redux). |
| **Styling** | **TailwindCSS** 🎨 | Rapid UI development. |
| **Components** | **Radix UI** 🧩 | Accessible, unstyled primitives. |

### Mobile Strategy (The "Super App" Approach)
| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Framework** | **Expo + React Native** 📱 | Build Native iOS/Android apps using React. Free, Open Source, and high performance. |
| **Routing** | **Expo Router** 🛣️ | File-based routing matching Next.js. Share navigation logic between Web and Mobile. |
| **Styling** | **NativeWind** 🌬️ | Use TailwindCSS on Mobile. Share design tokens (colors, spacing) 100% with Web. |
| **Strategy** | **Server-Driven UI** 🧠 | One app for all tenants. The app fetches configuration (colors, logo, layout) from the server at startup, adapting instantly to the specific tenant's brand without rebuilding. **Zero-minute deployment for clients.** |

### Quality Assurance & Dev Experience
| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Testing** | **Vitest** 🧪 | Blazing fast Unit/Integration testing. Replaces Jest. Essential for logic verification. |
| **Linting/Formatting** | **Biome** 🌪️ | Ultra-fast Rust-based linter/formatter. |
| **Pre-commit Hooks** | **Husky + Lint-staged** 🐶 | **The Gatekeeper**. Prevents committing broken code. Ensures repo hygiene automatically. |
| **Observability** | **GlitchTip** 🚨 | Open-source Sentry alternative. Tracks errors in Real-time with code context. |
| **Email Testing** | **Mailpit** 📬 | Local SMTP server. safely test "Forgot Password" flows without real emails. |
| **API Docs** | **Scalar** 📜 | Beautiful, interactive API documentation generated from code. |

---

## 🔒 2. Security Standards (S1-S8 Protocol)

Security is not an add-on; it is baked into the core architecture.

### **S1: Environment Verification** 🌍
*   **Tool**: **Zod** (integrated with `@nestjs/config`).
*   **Implementation**: Application **FAILS TO START** if any critical variable (DB_URL, JWT_SECRET, etc.) is missing or malformed.
*   **Strictness**: Validation happens before the app listens on any port.

### **S2: Tenant Isolation** 🏢
*   **Tool**: **Drizzle ORM** (Schema-based or Row-level isolation).
*   **Implementation**:
    *   **Postgres Schemas**: Each tenant gets a dedicated schema (e.g., `tenant_123`).
    *   **Middleware**: Extracts `X-Tenant-ID`, validates it, and sets the DB search path.
    *   **Guard**: `TenantScopedGuard` prevents cross-tenant access at the controller level.

### **S3: Input Validation** 🛡️
*   **Tool**: **Zod** (via `nestjs-zod`).
*   **Implementation**:
    *   Global Validation Pipe.
    *   Strict whitelisting (strip unknown properties).
    *   Sanitization of all incoming JSON/Params against defined Zod schemas.

### **S4: Audit Logging** 📝
*   **Tool**: **NestJS Interceptors** + **AsyncLocalStorage**.
*   **Implementation**:
    *   Every write operation (POST/PUT/DELETE) is logged.
    *   Captures: `Who` (User/IP), `What` (Action), `Where` (Tenant), `When`.
    *   Stored immutably in a separate audit table/collection.

### **S5: Exception Handling** ⚠️
*   **Tool**: **Global Exception Filter**.
*   **Implementation**:
    *   Standardized error responses (no stack traces to client).
    *   Operational errors (400/404) vs System errors (500).
    *   Automatic reporting to **GlitchTip**.

### **S6: Rate Limiting** 🚦
*   **Tool**: **Redis** + **@nestjs/throttler**.
*   **Implementation**:
    *   Dynamic limits based on Tenant Tier (Free vs Enterprise).
    *   DDoS protection (IP blocking after violation threshold).
    *   Distributed state via Redis (works across detailed instances).

### **S7: Encryption** 🔐
*   **Tool**: **AES-256-GCM** (via `crypto` module).
*   **Implementation**:
    *   **At Rest**: Sensitive fields (API Keys, PII) encrypted in DB.
    *   **In Transit**: Forced TLS/HTTPS (via Traefik).
    *   Database connection requires SSL.

### **S8: Web Security** 🌐
*   **Tool**: **Helmet** + **CORS**.
*   **Implementation**:
    *   Strict Content Security Policy (CSP).
    *   HSTS (HTTP Strict Transport Security) enabled.
    *   CORS configured dynamically per Tenant domain.
    *   CSRF protection for cookie-based sessions.

---

## 🛠️ 3. Development Workflow (DevOps)

1.  **Code**: Developer pushes to a feature branch.
2.  **Husky**: Runs `Biome` check (lint/format) locally.
3.  **PR**: GitHub Action runs **Vitest** (Unit tests).
4.  **Merci/Squash**: Code merged to `main`.
5.  **Build**: **Turborepo** detects changes and builds Docker images.
6.  **Deploy**: Images pushed to registry and deployed via Docker Compose/K8s.

---
*Document generated by Apex AI Assistant - 2026*
