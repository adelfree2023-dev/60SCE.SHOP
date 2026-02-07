# 🔐 Apex v2 - Project Vault & Credentials Masterlist
**Classification:** `TOP SECRET - EYES ONLY`
**Generated:** 2026-02-07

---

## 🌍 Production Server Details
- **Provider:** Google Cloud Platform (GCP)
- **Instance Name:** apex-v2-server
- **Public IP:** `136.111.146.88`
- **Zone:** `us-central1-a`
- **OS:** Ubuntu 22.04 LTS

### 🔑 SSH Access
- **User:** `apex-v2-dev`
- **Private Key Path:** `C:/Users/Dell/.ssh/id_ed25519_apex`
- **Public Key:** (Added to GCP metadata)

---

## 🗄️ Database Credentials (PostgreSQL)
- **Host:** `localhost` (Internal Docker Network)
- **Port:** `5432`
- **User:** `apex`
- **Password:** `apex_secret` (⚠️ CHANGE FOR PRODUCTION)
- **Database:** `apex_v2`
- **URL:** `postgresql://apex:apex_secret@localhost:5432/apex_v2`

---

## 🚀 Cache & Queue (Redis)
- **Host:** `localhost`
- **Port:** `6379`
- **Password:** `redis_secret` (⚠️ CHANGE FOR PRODUCTION)
- **URL:** `redis://:redis_secret@localhost:6379`

---

## 📦 Object Storage (MinIO / S3)
- **Console URL:** `http://136.111.146.88:9001`
- **API URL:** `http://136.111.146.88:9000`
- **Root User:** `minioadmin`
- **Root Password:** `minioadmin123` (⚠️ CHANGE FOR PRODUCTION)
- **Default Bucket:** `apex-assets`

---

## 🛡️ Security Keys
### JWT (JSON Web Token)
- **Secret:** `your_very_long_secret_key_minimum_32_chars_long` (⚠️ DEV KEY)
- **Expiry:** `7d`

---

## 📧 Email Testing (Mailpit)
- **SMTP Port:** `1025`
- **Web Interface:** `http://136.111.146.88:8025`

---

> **⚠️ SECURITY WARNING:**
> This file contains sensitive development credentials. 
> For **Production Environment**, referenced passwords MUST be rotated using `openssl rand -hex 32` and stored in a secure `.env` file on the server, not committed to git.
