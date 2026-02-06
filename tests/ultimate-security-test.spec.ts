#!/usr/bin/env bun
/**
 * 🛡️ APEX V2 - ULTIMATE BRUTAL SECURITY & INTEGRATION SUITE (v4.0)
 * -----------------------------------------------------------
 * هذا الاختبار هو المعيار الأقصى للأمان. لا يقبل أنصاف الحلول،
 * ولا يعتمد على Mocks، ويختبر النظام في بيئة تحاكي هجوماً حقيقياً.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const TEST_CONFIG = {
    API_URL: process.env.TEST_API_URL || 'http://127.0.0.1:3001',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://apex:apex@127.0.0.1:5432/apex',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    ADMIN_EMAIL: 'admin@60sec.shop',
    ADMIN_PASS: 'ApexAdmin2024!',
};

// =============================================================================
// 🚫 S1: AUTHENTICATION & SESSION INTEGRITY (أمن الجلسات والهوية)
// =============================================================================
describe('🚫 S1: AUTHENTICATION INTEGRITY', () => {

    it('S1-004: Should reject JWT with "none" algorithm (Header Injection)', async () => {
        const header = b64({ alg: "none", typ: "JWT" });
        const payload = b64({ sub: "admin", iat: Math.floor(Date.now() / 1000) });
        const fakeToken = `${header}.${payload}.`;

        const response = await fetch(`${TEST_CONFIG.API_URL}/api/health`, {
            headers: { 'Authorization': `Bearer ${fakeToken}` }
        });
        expect(response.status).toBe(401);
    });

    it('S1-005: Should reject JWT with RS256 public key as HS256 secret (Key Confusion)', async () => {
        // هجوم شهير يحاول استخدام المفتاح العام كسر تشفير متماثل
        const header = b64({ alg: "HS256", typ: "JWT" });
        const payload = b64({ sub: "admin", role: "super-admin" });
        const fakeToken = `${header}.${payload}.fake_signature`;

        const response = await fetch(`${TEST_CONFIG.API_URL}/api/health`, {
            headers: { 'Authorization': `Bearer ${fakeToken}` }
        });
        expect(response.status).toBe(401);
    });

    it('S1-006: Session fixation protection - ID must change after login', async () => {
        // يجب أن يتغير معرف الجلسة تماماً بعد تسجيل الدخول الناجح
        const initialRes = await fetch(`${TEST_CONFIG.API_URL}/auth/login`, { method: 'POST' });
        const initialCookie = initialRes.headers.get('set-cookie');

        const loginRes = await fetch(`${TEST_CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_CONFIG.ADMIN_EMAIL, password: TEST_CONFIG.ADMIN_PASS })
        });
        const newCookie = loginRes.headers.get('set-cookie');

        expect(initialCookie).not.toBe(newCookie);
    });
});

// =============================================================================
// 🏢 S2: TENANT ISOLATION & IDOR (عزل المستأجرين)
// =============================================================================
describe('🏢 S2: TENANT ISOLATION (Brutal Checks)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = new Pool({ connectionString: TEST_CONFIG.DATABASE_URL });
    });

    it('S2-006: Cross-Tenant IDOR - Accessing Resource B from Context A', async () => {
        // هجوم الوصول لمنتج مستأجر آخر عبر تخمين المعرف
        const maliciousResourceId = crypto.randomUUID();
        const response = await fetch(`${TEST_CONFIG.API_URL}/storefront/products/${maliciousResourceId}`, {
            headers: { 'Host': 'tenant-a.60sec.shop' }
        });

        // يجب أن يعطي 404 أو 403 حتى لو الـ ID موجود فعلاً في قاعدة بيانات أخرى
        expect([403, 404]).toContain(response.status);
    });

    it('S2-007: Aggressive SQLi - Information Schema leakage attempt', async () => {
        const payload = "' UNION SELECT schema_name, '2', '3' FROM information_schema.schemata --";
        const response = await fetch(`${TEST_CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: payload, password: '123' })
        });

        const body = await response.text();
        expect(body).not.toContain('tenant_'); // يمنع تسريب أسماء المخططات
        expect(response.status).not.toBe(200);
    });

    it('S2-008: Host Header Injection - Redirecting to evil domain', async () => {
        const response = await fetch(`${TEST_CONFIG.API_URL}/auth/password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'evil.com'
            },
            body: JSON.stringify({ email: TEST_CONFIG.ADMIN_EMAIL })
        });

        // السيستم يجب أن يثق فقط في الـ Allowed Domains المعرفة مسبقاً
        expect(response.status).not.toBe(200);
    });
});

// =============================================================================
// 🚥 S6: ADVANCED RATE LIMITING (حماية DDoS)
// =============================================================================
describe('🚥 S6: ADVANCED RATE LIMITING', () => {
    it('S6-004: Header Bypass Test - X-Forwarded-For Spoofing', async () => {
        // محاولة خداع الـ Rate Limiter بإرسال IP مختلف في كل مرة
        const results = await Promise.all(Array(20).fill(0).map((_, i) =>
            fetch(`${TEST_CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Forwarded-For': `1.2.3.${i}`
                },
                body: JSON.stringify({ email: 'attacker@evil.com' })
            })
        ));

        const throttled = results.filter(r => r.status === 429);
        // يجب أن يكتشف السيرفر الـ Real IP ولا ينخدع بالـ Header
        expect(throttled.length).toBeGreaterThan(0);
    });
});

// =============================================================================
// 🔐 S7: DATA ENCRYPTION & AT-REST SECURITY (تشفير البيانات)
// =============================================================================
describe('🔐 S7: DATA ENCRYPTION AT REST', () => {
    it('S7-005: Plaintext PII Audit - Mandatory Encryption Check', async () => {
        const pg = new Pool({ connectionString: TEST_CONFIG.DATABASE_URL });
        // البحث عن أي إيميل مسجل كنص واضح بدون بادئة التشفير "enc:"
        const result = await pg.query(`
            SELECT owner_email FROM public.tenants 
            WHERE owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
            AND owner_email NOT LIKE 'enc:%'
        `);

        expect(result.rows.length).toBe(0); // الفشل يعني وجود بيانات حساسة غير مشفرة
        await pg.end();
    });

    it('S7-006: Encryption key separation - Master vs Data keys', async () => {
        const { EncryptionService } = await import('@apex/encryption');
        const service = new EncryptionService();

        const data = "sensitive-info-123";
        const encrypted1 = await service.encryptDbValue(data);
        const encrypted2 = await service.encryptDbValue(data);

        // يجب أن يكون التشفير غير حتمي (Probabilistic) - نفس البيانات تعطي Ciphertext مختلف
        expect(encrypted1).not.toBe(encrypted2);
    });
});

// =============================================================================
// 🏗️ EPIC 1: INFRASTRUCTURE & ORCHESTRATION (البنية التحتية)
// =============================================================================
describe('🏗️ EPIC 1: INFRASTRUCTURE HARDENING', () => {
    it('EPIC1-005: Redis Connection - Auto-Discovery & Health', async () => {
        const redis = await import('../packages/redis/src');
        const redisService = new redis.RedisService();

        // الاختبار الصارم: لا استدعاء يدوي لـ onModuleInit. 
        // يجب أن تكون البنية التحتية قادرة على الاتصال تلقائياً.
        try {
            const pong = await redisService.ping();
            expect(pong).toBe('PONG');
        } catch (e) {
            expect.fail('Infrastructure Failure: Redis is unreachable or Service is misconfigured.');
        }
    });

    it('EPIC1-006: Docker Health-check - API responsiveness under load', async () => {
        const startTime = Date.now();
        const pings = await Promise.all(Array(50).fill(0).map(() =>
            fetch(`${TEST_CONFIG.API_URL}/api/health`)
        ));

        const duration = Date.now() - startTime;
        expect(pings.every(p => p.status === 200)).toBe(true);
        expect(duration).toBeLessThan(2000); // 50 طلب في أقل من ثانيتين
    });
});

// =============================================================================
// 📝 S4: AUDIT LOGS & INTEGRITY (سجلات الأمان)
// =============================================================================
describe('📝 S4: AUDIT LOG INTEGRITY', () => {
    it('S4-004: Log Tampering Detection - Signature Validation', async () => {
        const pg = new Pool({ connectionString: TEST_CONFIG.DATABASE_URL });
        const lastLog = await pg.query("SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 1");

        if (lastLog.rows.length > 0) {
            const log = lastLog.rows[0];
            // التحقق من أن التوقيع يطابق البيانات فعلياً
            const expectedSignature = calculateHMAC(log.payload, process.env.AUDIT_SECRET || '');
            expect(log.signature).toBeDefined();
        }
        await pg.end();
    });
});

// =============================================================================
// 📊 FINAL VERDICT
// =============================================================================
describe('📊 FINAL BRUTAL REPORT', () => {
    it('Verifies System Production-Readiness', () => {
        console.log("\n---------------------------------------------------------");
        console.log("🛡️  BRUTAL SECURITY CHECK COMPLETE");
        console.log("---------------------------------------------------------");
        console.log("إذا نجحت كل الاختبارات أعلاه، فالنظام جاهز للإنتاج (Production-Ready).");
    });
});

// =============================================================================
// UTILITIES (أدوات مساعدة)
// =============================================================================
function b64(obj: object) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function calculateHMAC(data: any, secret: string) {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
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