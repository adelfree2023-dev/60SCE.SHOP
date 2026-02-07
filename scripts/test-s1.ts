#!/usr/bin/env bun
/**
 * S1 Protocol Demonstration Script
 *
 * Usage:
 *   bun run scripts/test-s1.ts
 *
 * This script proves that the application crashes immediately
 * when environment variables are invalid (S1 Compliance)
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 S1 Protocol Test Suite');
console.log('='.repeat(50));

const tests = [
  {
    name: 'Missing JWT_SECRET',
    env: {
      JWT_SECRET: '',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'minioadmin123',
    },
    shouldCrash: true,
    expectedError: 'S1 Violation',
  },
  {
    name: 'Short JWT_SECRET (<32 chars)',
    env: {
      JWT_SECRET: 'short_secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'minioadmin123',
    },
    shouldCrash: true,
    expectedError: 'at least 32 characters',
  },
  {
    name: 'Invalid JWT_SECRET (special chars)',
    env: {
      JWT_SECRET: 'invalid_secret_with_@_symbol!',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'minioadmin123',
    },
    shouldCrash: true,
    expectedError: 'invalid characters',
  },
  {
    name: 'Valid JWT_SECRET (32+ chars)',
    env: {
      JWT_SECRET: 'valid_secret_key_minimum_32_chars_long',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'minioadmin123',
    },
    shouldCrash: false,
    expectedError: null,
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`\n📝 Test: ${test.name}`);
  console.log(`   Expected: ${test.shouldCrash ? 'CRASH 💥' : 'SUCCESS ✅'}`);

  // Run test in subprocess
  const result = spawn('bun', ['run', 'packages/config/src/index.ts'], {
    env: { ...process.env, ...test.env, ENABLE_S1_ENFORCEMENT: 'true' },
    stdio: 'pipe',
    cwd: join(__dirname, '..'),
  });

  let output = '';
  let errorOutput = '';

  result.stdout.on('data', (data) => {
    output += data.toString();
  });

  result.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  const exitCode = await new Promise((resolve) => {
    result.on('close', resolve);
  });

  const crashed = exitCode !== 0;
  const fullOutput = output + errorOutput;

  if (crashed === test.shouldCrash) {
    if (
      test.shouldCrash &&
      test.expectedError &&
      fullOutput.includes(test.expectedError)
    ) {
      console.log(`   Result: ✅ PASS (Crashed with expected error)`);
      console.log(
        `   Error: ${fullOutput.split('S1 Violation')[1]?.substring(0, 100) || 'N/A'}`
      );
      passed++;
    } else if (!test.shouldCrash) {
      console.log(`   Result: ✅ PASS (Started successfully)`);
      passed++;
    } else {
      console.log(`   Result: ❌ FAIL (Crashed but with wrong error)`);
      console.log(`   Output: ${fullOutput.substring(0, 200)}`);
      failed++;
    }
  } else {
    console.log(
      `   Result: ❌ FAIL (Expected ${test.shouldCrash ? 'crash' : 'success'}, got ${crashed ? 'crash' : 'success'})`
    );
    console.log(`   Output: ${fullOutput.substring(0, 200)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}
