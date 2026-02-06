#!/usr/bin/env bun
/**
 * Sentry Integration Verification Script
 * Provides concrete evidence that Sentry is properly configured
 */

console.log('🔍 SENTRY INTEGRATION VERIFICATION\n');
console.log('='.repeat(60));

// Test 1: Check API Files
console.log('\n📦 TEST 1: API Files & Packages');
console.log('-'.repeat(60));

const fs = require('fs');
const path = require('path');

// Check main.ts has Sentry import
const apiMainPath = path.join(process.cwd(), 'apps/api/src/main.ts');
if (fs.existsSync(apiMainPath)) {
    const content = fs.readFileSync(apiMainPath, 'utf-8');
    const hasSentryImport = content.includes('@sentry/node');
    const hasSentryInit = content.includes('Sentry.init');

    console.log(`✓ main.ts exists`);
    console.log(`${hasSentryImport ? '✓' : '✗'} Sentry import found`);
    console.log(`${hasSentryInit ? '✓' : '✗'} Sentry.init() found`);
} else {
    console.log('✗ main.ts not found');
}

// Check API package.json
const apiPkgPath = path.join(process.cwd(), 'apps/api/package.json');
if (fs.existsSync(apiPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf-8'));
    const hasSentry = pkg.dependencies && pkg.dependencies['@sentry/node'];
    console.log(`${hasSentry ? '✓' : '✗'} @sentry/node in dependencies: ${hasSentry || 'NOT FOUND'}`);
}

// Test 2: Check Storefront Files
console.log('\n📦 TEST 2: Storefront Files & Packages');
console.log('-'.repeat(60));

const storefrontFiles = [
    'apps/storefront/sentry.client.config.ts',
    'apps/storefront/sentry.server.config.ts',
    'apps/storefront/sentry.edge.config.ts',
    'apps/storefront/next.config.js',
];

storefrontFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✓' : '✗'} ${path.basename(file)} exists`);

    if (exists && file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasSentry = content.includes('@sentry/nextjs');
        console.log(`  ${hasSentry ? '✓' : '✗'} Contains @sentry/nextjs import`);
    }
});

// Check Storefront package.json
const storefrontPkgPath = path.join(process.cwd(), 'apps/storefront/package.json');
if (fs.existsSync(storefrontPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(storefrontPkgPath, 'utf-8'));
    const hasSentry = pkg.dependencies && pkg.dependencies['@sentry/nextjs'];
    console.log(`${hasSentry ? '✓' : '✗'} @sentry/nextjs in dependencies: ${hasSentry || 'NOT FOUND'}`);
}

// Test 3: Check Environment Variables
console.log('\n🔐 TEST 3: Environment Configuration');
console.log('-'.repeat(60));

const envProdPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envProdPath)) {
    const envContent = fs.readFileSync(envProdPath, 'utf-8');
    const hasDSN = envContent.includes('SENTRY_DSN=');
    const hasEnv = envContent.includes('SENTRY_ENVIRONMENT=');
    const hasRelease = envContent.includes('SENTRY_RELEASE=');

    console.log(`✓ .env.production exists`);
    console.log(`${hasDSN ? '✓' : '✗'} SENTRY_DSN configured`);
    console.log(`${hasEnv ? '✓' : '✗'} SENTRY_ENVIRONMENT set`);
    console.log(`${hasRelease ? '✓' : '✗'} SENTRY_RELEASE set`);

    if (hasDSN) {
        const dsnMatch = envContent.match(/SENTRY_DSN=(.+)/);
        if (dsnMatch) {
            const dsn = dsnMatch[1].trim();
            console.log(`  DSN: ${dsn.substring(0, 30)}...`);
        }
    }
} else {
    console.log('⚠️  .env.production not found (will use environment variables)');
}

// Test 4: Verify Installation
console.log('\n📥 TEST 4: Package Installation');
console.log('-'.repeat(60));

const { execSync } = require('child_process');

try {
    // Check API node_modules
    const apiNodeModules = path.join(process.cwd(), 'apps/api/node_modules/@sentry/node');
    if (fs.existsSync(apiNodeModules)) {
        const pkgJson = JSON.parse(fs.readFileSync(path.join(apiNodeModules, 'package.json'), 'utf-8'));
        console.log(`✓ @sentry/node installed: v${pkgJson.version}`);
    } else {
        console.log('✗ @sentry/node NOT installed in node_modules');
    }

    // Check Storefront node_modules
    const storefrontNodeModules = path.join(process.cwd(), 'apps/storefront/node_modules/@sentry/nextjs');
    if (fs.existsSync(storefrontNodeModules)) {
        const pkgJson = JSON.parse(fs.readFileSync(path.join(storefrontNodeModules, 'package.json'), 'utf-8'));
        console.log(`✓ @sentry/nextjs installed: v${pkgJson.version}`);
    } else {
        console.log('✗ @sentry/nextjs NOT installed in node_modules');
    }
} catch (error) {
    console.log('⚠️  Could not verify package installation:', error.message);
}

// Test 5: Test Sentry Initialization (Dry Run)
console.log('\n🧪 TEST 5: Initialization Test');
console.log('-'.repeat(60));

try {
    process.env.SENTRY_DSN = 'https://8142937fd486d889e5f8ec0113b4faa2@o4510677183168512.ingest.us.sentry.io/4510801156571136';
    process.env.SENTRY_ENVIRONMENT = 'verification-test';

    const Sentry = require('@sentry/node');

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: 'verification-test',
        tracesSampleRate: 0,
        beforeSend: () => null, // Prevent actual sending during test
    });

    console.log('✓ Sentry SDK loaded successfully');
    console.log('✓ Sentry.init() executed without errors');

    // Try to capture a test error (will be blocked by beforeSend)
    try {
        Sentry.captureMessage('Test verification message', 'info');
        console.log('✓ Sentry.captureMessage() works');
    } catch (err) {
        console.log('✗ Sentry.captureMessage() failed:', err.message);
    }

} catch (error) {
    console.log('✗ Sentry initialization failed:', error.message);
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

const checks = {
    'API Configuration': fs.existsSync(apiMainPath) && fs.readFileSync(apiMainPath, 'utf-8').includes('Sentry.init'),
    'API Package': fs.existsSync(path.join(process.cwd(), 'apps/api/node_modules/@sentry/node')),
    'Storefront Config Files': storefrontFiles.every(f => fs.existsSync(path.join(process.cwd(), f))),
    'Storefront Package': fs.existsSync(path.join(process.cwd(), 'apps/storefront/node_modules/@sentry/nextjs')),
    'Environment Config': fs.existsSync(envProdPath),
};

Object.entries(checks).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
});

const allPassed = Object.values(checks).every(v => v);
console.log('\n' + (allPassed ? '🎉 ALL CHECKS PASSED!' : '⚠️  SOME CHECKS FAILED'));
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
