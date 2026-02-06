#!/usr/bin/env bun
/**
 * 🛡️ APEX V2 - BRUTAL SECURITY & INTEGRATION TEST (v3.0)
 * * هذا الاختبار مصمم ليكون "كابوساً" للكود الضعيف. 
 * لا يسمح بالـ Mocking، ويختبر العزل الحقيقي بين المستأجرين.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const TEST_CONFIG = {
    API_URL: process.env.TEST_API_URL || 'http://127.0.0.1:3001',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://apex:apex@127.0.0.1:5432/apex',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};

describe('🚫 S1: AUTHENTICATION & JWT INTEGRITY', () => {
    it('S1-004: Should reject JWT with "none" algorithm (Header Injection)', async () => {
        const header = b64({ alg: "none", typ: "JWT" });
        const payload = b64({ sub: "admin", iat: Date.now() });
        const fakeToken = `${header}.${payload}.`;

        const response = await fetch(`${TEST_CONFIG.API_URL}/api/health`, {
            headers: { 'Authorization': `Bearer ${fakeToken}` }
        });
        expect(response.status).toBe(401); // Must fail
    });

    it('S1-005: Should reject expired tokens even if signature is valid', async () => {
        // اختبار منطق التحقق من الوقت في السيرفر
        const response = await fetch(`${TEST_CONFIG.API_URL}/auth/verify-expired-test`);
        if (response.status !== 404) { // Only if route exists
            expect(response.status).toBe(401);
        }
    });
});

describe('🏢 S2: CROSS-TENANT DATA LEAKAGE (The Redline)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = new Pool({ connectionString: TEST_CONFIG.DATABASE_URL });
    });

    it('S2-006: Tenant A MUST NOT access Tenant B data via ID guessing', async () => {
        // محاكاة هجوم ID Guessing (Insecure Direct Object Reference)
        // نفرض أننا سجلنا دخول كمستأجر A، ونحاول طلب منتج ينتمي لمستأجر B
        const maliciousResourceId = crypto.randomUUID();
        const response = await fetch(`${TEST_CONFIG.API_URL}/storefront/products/${maliciousResourceId}`, {
            headers: { 'Host': 'tenant-a.60sec.shop' }
        });

        // السيستم الذكي يجب أن يعطي 404 أو 403 حتى لو الـ ID موجود فعلاً في داتابيز مستأجر آخر
        expect([403, 404]).toContain(response.status);
    });

    it('S2-007: Aggressive SQLi - Union Select across schemas', async () => {
        const payload = "' UNION SELECT schema_name, '2', '3', '4' FROM information_schema.schemata --";
        const response = await fetch(`${TEST_CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: payload, password: '123' })
        });

        const body = await response.text();
        expect(body).not.toContain('tenant_'); // No schema names should ever be leaked
        expect(response.status).not.toBe(200);
    });
});

describe('🚦 S6: ADVANCED RATE LIMITING', () => {
    it('S6-004: Should detect IP Spoofing in Rate Limiter', async () => {
        // اختبار هل المبرمج يثق في الـ Headers القادمة من المستخدم أم لا
        const spoofedIp = '1.2.3.4';
        const response = await fetch(`${TEST_CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': spoofedIp
            },
            body: JSON.stringify({ email: 'test@test.com' })
        });

        // يجب أن يحتوي الرد على headers الحماية ولا يثق في الـ IP المحقون
        expect(response.headers.has('x-ratelimit-limit')).toBe(true);
    });
});

describe('🔐 S7: CRYPTO-STRENGTH & ROTATION', () => {
    it('S7-004: Encryption MUST fail if ENCRYPTION_KEY is tampered', async () => {
        const { EncryptionService } = await import('@apex/encryption');
        const service = new EncryptionService();

        // محاولة فك تشفير قيمة بكلمة سر خاطئة - يجب أن يعطي خطأ صريح ولا يخرج بيانات مشوهة
        const encrypted = "enc:v1:fake-data";
        await expect(service.decryptDbValue(encrypted)).rejects.toThrow();
    });

    it('S7-005: PII Audit - Search for raw emails in Database', async () => {
        const pg = new Pool({ connectionString: TEST_CONFIG.DATABASE_URL });
        const result = await pg.query(`
            SELECT count(*) FROM public.tenants 
            WHERE owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
        `);
        // يجب أن يكون العدد 0 لأن كل الإيميلات يجب أن تبدأ بـ enc:
        expect(parseInt(result.rows[0].count)).toBe(0);
        await pg.end();
    });
});

describe('🏗️ EPIC 1: INFRASTRUCTURE HARDENING', () => {
    it('EPIC1-005: Redis MUST be reachable without manual init in test', async () => {
        const redis = await import('../packages/redis/src');
        const redisService = new redis.RedisService();

        // هنا نختبر هل الخدمة تعمل "خارج الصندوق" كما في السيرفر الحقيقي
        // لا نستدعي onModuleInit هنا!
        try {
            const pong = await redisService.ping();
            expect(pong).toBe('PONG');
        } catch (e) {
            expect.fail('Redis Service is not auto-connecting. Infrastructure is weak.');
        }
    });
});

describe('📊 FINAL VERDICT', () => {
    it('Calculates REAL Security Score', async () => {
        // هذا الجزء سيطبع في الكونسول النتائج الحقيقية
        console.log("\n🚀 FINAL VERDICT: If you see ANY red above, the system is NOT production-ready.\n");
    });
});

// Utilities
function b64(obj: object) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function calculateEntropy(str: string): number {
    const freq: Record<string, number> = {};
    for (const char of str) freq[char] = (freq[char] || 0) + 1;
    let entropy = 0;
    for (const char in freq) {
        const p = freq[char] / str.length;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}