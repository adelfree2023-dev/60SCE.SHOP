---
description: Repairs the database schema and seeds a Super Admin user.
---

1. Create the `users` table if missing by running the migration SQL.
   ```bash
   ssh -i "C:/Users/Dell/.ssh/id_ed25519_apex" apex-v2-dev@34.102.116.215 "
   export PATH=\$PATH:/home/apex-v2-dev/.bun/bin && 
   cd /home/apex-v2-dev/apex-v2 && 
   docker exec -i apex-postgres psql -U apex -d apex < migration_identity_final.sql"
   ```

// turbo
2. Seed the Super Admin user via script.
   ```bash
   ssh -i "C:/Users/Dell/.ssh/id_ed25519_apex" apex-v2-dev@34.102.116.215 "
   export PATH=\$PATH:/home/apex-v2-dev/.bun/bin && 
   cd /home/apex-v2-dev/apex-v2 && 
   docker cp scripts/seed-admin.ts apex-api:/app/seed-admin.ts && 
   docker exec apex-api bun run seed-admin.ts"
   ```

   > [!IMPORTANT]
   > **Credentials:**
   > - **Email:** `admin@60sec.shop`
   > - **Password:** `ApexAdmin2024!`
