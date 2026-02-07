---
description: Strict Audit-First debugging protocol.
---

# 🔍 Workflow: Debug & Fix

Use this when a user reports an error or a test fails.

1. **The Audit**
   - Read the full error stack trace.
   - Run the specific test: `bun test [path/to/test]`.
   - Identify the exact line of failure.

2. **The Fix (No Laziness)**
   - Open the source file.
   - Analyze the logic relative to the **Constitution**.
   - Apply the COMPLETE fix. Do not use placeholders.

3. **The Proof**
   - Run the test again: `bun test [path/to/test]`.
   - If it passes, show the output to the user.
   - If it fails, repeat Step 1.

4. **Constitution Check**
   - Ensure the fix didn't violate S1-S8.
