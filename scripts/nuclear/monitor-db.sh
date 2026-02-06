#!/bin/bash
# APEX V2 - DB Connection Monitor
# usage: ./monitor-db.sh <duration_seconds>

DURATION=$1
OUTPUT="db_connections.log"

echo "timestamp,active,idle,total" > $OUTPUT
echo "Monitoring database connections for ${DURATION}s..."

for ((i=1; i<=$DURATION; i++)); do
    TIMESTAMP=$(date +%s)
    STATS=$(docker exec apex-postgres psql -U apex -d apex -tAc "SELECT 
        count(*) FILTER (WHERE state = 'active'),
        count(*) FILTER (WHERE state = 'idle'),
        count(*)
        FROM pg_stat_activity WHERE usename = 'apex'")
    
    # Format: active|idle|total (piping result from psql -tAc gives | separator)
    # We replace | with , for CSV
    CSV_STATS=$(echo $STATS | sed 's/|/,/g')
    
    echo "${TIMESTAMP},${CSV_STATS}" >> $OUTPUT
    sleep 1
done

echo "Monitoring complete. Result saved to $OUTPUT"
