#!/usr/bin/env bun
/**
 * APEX V2 - INFRASTRUCTURE VERIFICATION SCRIPT
 * Quick health check for all Docker services
 */

import { execSync } from 'child_process';

console.log('🔍 APEX V2 - INFRASTRUCTURE VERIFICATION\n');

const checks = [
    {
        name: 'PostgreSQL Health',
        cmd: 'docker exec apex-postgres pg_isready -U apex 2>&1',
        validate: (output: string) => output.includes('accepting connections'),
    },
    {
        name: 'pgvector Extension',
        cmd: `docker exec apex-postgres psql -U apex -d apex -tAc "SELECT installed_version FROM pg_available_extensions WHERE name = 'vector'" 2>&1`,
        validate: (output: string) => output.trim().length > 0,
    },
    {
        name: 'Redis Health',
        cmd: 'docker exec apex-redis redis-cli ping 2>&1',
        validate: (output: string) => output.trim() === 'PONG',
    },
    {
        name: 'MinIO Running',
        cmd: 'docker ps --filter "name=apex-minio" --format "{{.Status}}"',
        validate: (output: string) => output.includes('Up'),
    },
    {
        name: 'Traefik Running',
        cmd: 'docker ps --filter "name=apex-traefik" --format "{{.Status}}"',
        validate: (output: string) => output.includes('Up'),
    },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
    try {
        console.log(`\n🧪 ${check.name}`);
        const output = execSync(check.cmd, { encoding: 'utf-8' }).trim();

        if (check.validate(output)) {
            console.log('   ✅ PASS');
            passed++;
        } else {
            console.log('   ❌ FAIL');
            console.log(`   Output: ${output.substring(0, 100)}`);
            failed++;
        }
    } catch (error: any) {
        console.log('   ❌ ERROR');
        console.log(`   ${error.message.substring(0, 100)}`);
        failed++;
    }
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('\n✅ All infrastructure services are healthy!');
    process.exit(0);
} else {
    console.log('\n⚠️ Some services are not healthy');
    process.exit(1);
}
