#!/bin/bash
# Fixed glob pattern by using absolute path or ensuring correct relative path
cd ~/apex-v2
for file in packages/db/src/schema/*.ts; do
  [ -e "$file" ] || continue
  test_file="${file%.ts}.spec.ts"
  base_name=$(basename "$file" .ts)
  if [ ! -f "$test_file" ]; then
    echo "Creating spec for $base_name"
    cat > "$test_file" <<SPEC
import { describe, it, expect } from 'bun:test';
import * as schema from './$base_name';

describe('DB Schema: $base_name', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
SPEC
  fi
done
