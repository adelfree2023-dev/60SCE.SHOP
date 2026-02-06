#!/bin/bash
# server-start.sh

cd ~/apex-v2/apps/api
pkill -9 -f "bun.*main" || true
sleep 1

set -a
source ../../.env
export PORT=3001
set +a

echo "🚀 Starting API on port 3001..."
nohup /home/apex-v2-dev/.bun/bin/bun src/main.ts > /home/apex-v2-dev/api-server-debug.log 2>&1 &

sleep 3
if ps aux | grep -v grep | grep "bun src/main.ts" > /dev/null
then
    echo "✅ API is running (PID: $(pgrep -f 'bun.*main'))"
    netstat -tulpn | grep 3001
else
    echo "❌ API failed to start. Last 20 lines of log:"
    tail -n 20 /home/apex-v2-dev/api-server-debug.log
fi
