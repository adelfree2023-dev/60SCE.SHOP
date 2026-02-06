# Apex V2 Server Architecture & Infrastructure

Detailed technical breakdown of the production/dev server environment for Apex V2.

## 🌐 Server Identity
- **Primary IP**: `34.102.116.215`
- **Region/Provider**: Google Cloud Platform (GCP) / Instance-20260130
- **Primary OS**: Ubuntu 22.04 LTS (x86_64)

## 🔑 Access & Identity Management
- **Main Admin**: `root`
- **Application Owner**: `apex-v2-dev` (Owns the project files and docker processes)
- **Deployment User**: `adelfree2023` (Standard user with sudo rights)
- **SSH Key Path**: `C:/Users/Dell/.ssh/id_ed25519_apex`

## 📁 System Paths
- **Project Root**: `/home/apex-v2-dev/apex-v2`
- **Binary Paths**:
  - Bun: `/home/apex-v2-dev/.bun/bin/bun`
  - Docker: `/usr/bin/docker`

## 🐳 Container Orchestration (Docker Compose)

| Container Name | Image | Internal Port | External Mapping | Purpose |
|---------------|-------|---------------|------------------|---------|
| `apex-api` | `apex-v2-apex-api` | 3000 | `127.0.0.1:3001` | NestJS Core API |
| `apex-storefront` | `apex-v2-apex-storefront` | 3000 | `127.0.0.1:3002` | Next.js Frontend |
| `apex-postgres` | `ankane/pgvector:v0.5.1` | 5432 | `127.0.0.1:5432` | Database w/ Vector Search |
| `apex-redis` | `redis:7-alpine` | 6379 | `127.0.0.1:6379` | Cache & Rate Limiting |
| `apex-traefik` | `traefik:v2.10` | 80/443 | `0.0.0.0:80/443` | Reverse Proxy & SSL |
| `apex-minio` | `minio/minio:latest` | 9000 | - | Object Storage (S3) |
| `apex-mailpit` | `axllent/mailpit:latest` | 1025/8025 | `127.0.0.1:8025` (Web) | SMTP Testing Server |

## 🛠️ Operational Commands
- **Updating Code**: `git pull origin main && docker-compose up -d --build`
- **Database Entry**: `docker exec -it apex-postgres psql -U apex -d apex_v2`
- **Tail Logs**: `docker-compose logs -f apex-api`
- **Run Security Tests**: `docker exec -it apex-api bun test tests/ultimate-security-test.spec.ts`

## 🛡️ Security Gates
- **JWT**: Managed via `.env` (High entropy rotation enabled).
- **Isolation**: Tenant-scoped schemas (PostgreSQL).
- **Encryption**: AES-256 for PII, Argon2id for passwords.
