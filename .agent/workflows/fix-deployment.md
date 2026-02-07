---
description: Fixes the Storefront configuration and rebuilds the frontend with the correct API URL.
---

1. Ensure the `.env` file in the root directory contains the following:
   ```bash
   NEXT_PUBLIC_API_URL="https://api.60sec.shop"
   ```

// turbo
2. Rebuild the Storefront on the server with the environment variables exported.
   ```bash
   ssh -i "C:/Users/Dell/.ssh/id_ed25519_apex" apex-v2-dev@34.102.116.215 "
   export PATH=\$PATH:/home/apex-v2-dev/.bun/bin && 
   cd /home/apex-v2-dev/apex-v2 && 
   export NEXT_PUBLIC_API_URL=https://api.60sec.shop && 
   bun run build --filter @apex/storefront"
   ```

3. Restart the Docker containers to pick up any runtime environment changes.
   ```bash
   ssh -i "C:/Users/Dell/.ssh/id_ed25519_apex" apex-v2-dev@34.102.116.215 "
   cd /home/apex-v2-dev/apex-v2 && 
   docker compose restart"
   ```
