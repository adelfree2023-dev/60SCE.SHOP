#!/usr/bin/env bun
import { execSync } from 'child_process';

console.log('🏆 --- APEX V2: FINAL PHASE 1 - STEP 2 VERIFICATION --- 🏆\n');

const run = (cmd: string, title: string) => {
    console.log(`🔍 [TEST] ${title}`);
    try {
        const output = execSync(cmd, { stdio: 'pipe' }).toString();
        console.log(output);
        console.log(`✅ ${title} PASSED\n`);
    } catch (e: any) {
        console.error(`❌ ${title} FAILED`);
        console.error(e.stdout?.toString() || e.stderr?.toString());
        process.exit(1);
    }
};

// 1. S1 Test
run('~/.bun/bin/bun test tests/security/s1-env-validation.test.ts', 'S1: Environment Validation');

// 2. S6 Test
run('~/.bun/bin/bun test tests/security/s6-rate-limiting.test.ts', 'S6: Rate Limiting');

// 3. Provisioning Test
const timestamp = Date.now();
const tenantName = `final-test-${timestamp}`;
run(`~/.bun/bin/bun run scripts/provision-tenant.ts --store-name='${tenantName}' --owner-email='admin@apex.dev'`, 'North Star: Provisioning Engine');

// 4. S2 Isolation Test (with real tenant)
run(`TEST_HOSTNAME=${tenantName}.apex.local ~/.bun/bin/bun test tests/security/s2-tenant-isolation.test.ts`, 'S2: Tenant Isolation (Existing Tenant)');

console.log('🎉 --- ALL SECURITY PROTOCOLS VERIFIED --- 🎉');
