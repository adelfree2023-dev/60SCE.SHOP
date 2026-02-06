#!/usr/bin/env bun
/**
 * ⚡ QUICK SECURITY CHECK
 * فحص سريع للتحقق من الحالة الأمنية قبل التشغيل
 */

import { Pool } from 'pg';
import * as crypto from 'crypto';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ name, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? GREEN : status === 'FAIL' ? RED : YELLOW;
  console.log(`${color}${icon} ${name}: ${message}${RESET}`);
}

async function runChecks() {
  console.log('\n🛡️  APEX V2 - Quick Security Check\n');
  console.log('='.repeat(50));

  // S1: Environment Check
  console.log('\n📋 S1: Environment Validation');
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length === 0) {
    addResult('Required Env Vars', 'PASS', 'All required variables are set');
  } else {
    addResult('Required Env Vars', 'FAIL', `Missing: ${missingVars.join(', ')}`);
  }

  // JWT Secret Strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) {
    addResult('JWT Secret Length', 'PASS', `${jwtSecret.length} chars (min 32)`);
  } else {
    addResult('JWT Secret Length', 'FAIL', `${jwtSecret?.length || 0} chars (need 32+)`);
  }

  // S2: Database Isolation Check
  console.log('\n🏢 S2: Tenant Isolation');
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://apex:@127.0.0.1:5432/apex_v2';
    console.log(`\n🔌 Connecting to: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
    const pool = new Pool({
      connectionString
    });

    // Check for tenant schemas
    const schemaResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    if (schemaResult.rows.length > 0) {
      addResult('Tenant Schemas', 'PASS', `${schemaResult.rows.length} schemas found`);
    } else {
      addResult('Tenant Schemas', 'WARN', 'No tenant schemas found (may be fresh install)');
    }

    // Check for audit_logs table
    const auditResult = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'audit_logs' AND table_schema = 'public'
    `);

    if (auditResult.rows.length > 0) {
      addResult('Audit Logs Table', 'PASS', 'Table exists');
    } else {
      addResult('Audit Logs Table', 'FAIL', 'Table not found');
    }

    await pool.end();
  } catch (error: any) {
    addResult('Database Connection', 'FAIL', error.message);
  }

  // S3: Check for validation files
  console.log('\n🛡️  S3: Input Validation');
  try {
    const fs = await import('fs');
    const zodPipeExists = fs.existsSync('apps/api/src/common/pipes/zod-validation.pipe.ts');

    if (zodPipeExists) {
      addResult('Zod Validation Pipe', 'PASS', 'File exists');
    } else {
      addResult('Zod Validation Pipe', 'FAIL', 'File not found');
    }
  } catch {
    addResult('File Check', 'WARN', 'Could not check files');
  }

  // S6: Rate Limiting
  console.log('\n🚦 S6: Rate Limiting');
  try {
    const fs = await import('fs');
    const rateLimiterExists = fs.existsSync('packages/security/src/middlewares/rate-limiter.middleware.ts');

    if (rateLimiterExists) {
      addResult('Rate Limiter', 'PASS', 'Middleware exists');
    } else {
      addResult('Rate Limiter', 'WARN', 'Middleware not found');
    }
  } catch {
    addResult('Rate Limiter Check', 'WARN', 'Could not check');
  }

  // S7: Encryption
  console.log('\n🔐 S7: Encryption');
  try {
    const fs = await import('fs');
    const encryptionExists = fs.existsSync('packages/encryption/src/encryption.service.ts');

    if (encryptionExists) {
      addResult('Encryption Service', 'PASS', 'Service exists');
    } else {
      addResult('Encryption Service', 'FAIL', 'Service not found');
    }
  } catch {
    addResult('Encryption Check', 'WARN', 'Could not check');
  }

  // S8: Security Headers
  console.log('\n🌐 S8: Web Security');
  try {
    const fs = await import('fs');
    const helmetExists = fs.existsSync('apps/api/src/common/middleware/helmet.middleware.ts');

    if (helmetExists) {
      addResult('Helmet Middleware', 'PASS', 'Security headers configured');
    } else {
      addResult('Helmet Middleware', 'FAIL', 'Not found');
    }
  } catch {
    addResult('Helmet Check', 'WARN', 'Could not check');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  console.log(`${GREEN}✅ Passed: ${passed}${RESET}`);
  console.log(`${RED}❌ Failed: ${failed}${RESET}`);
  console.log(`${YELLOW}⚠️  Warnings: ${warnings}${RESET}`);

  const score = (passed / results.length) * 100;
  console.log(`\n🎯 Security Score: ${score.toFixed(1)}%`);

  if (failed === 0 && score >= 80) {
    console.log(`${GREEN}\n🎉 System is in EXCELLENT security state!${RESET}`);
    process.exit(0);
  } else if (failed === 0) {
    console.log(`${YELLOW}\n⚠️  System is in GOOD state but needs attention${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}\n❌ System has security issues that must be fixed!${RESET}`);
    process.exit(1);
  }
}

runChecks().catch(console.error);
