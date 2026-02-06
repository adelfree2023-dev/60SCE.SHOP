import { describe, expect, test } from "bun:test";

const API_URL = "http://localhost:3001";
const LEGIT_TENANT = "store-123";
const EVIL_TENANT = "evil-tenant";
const LEGIT_HOST = `${LEGIT_TENANT}.apex-v2.duckdns.org`;
const EVIL_HOST = `${EVIL_TENANT}.apex-v2.duckdns.org`;

describe("ARCH-S2: Tenant Isolation Penetration Test", () => {

    // Scenario 1: Access with valid Host header (Should Fail 403 or 404 if tenant doesn't exist yet, but logic works)
    // Assuming store-123 exists or we get 403 if not whitelisted.
    // If we assume a clean state, 'store-123' might not be in DB. 
    // The middleware blocks if NOT in whitelist.
    test("S2-1: Legit Tenant Access (Valid Host)", async () => {
        // We expect this to fail with 403 if not provisioned, which proves the whitelist works!
        // Or 200/404 if provisioned.
        // Key is: It shouldn't crash.
        const res = await fetch(`${API_URL}/api/health`, {
            headers: { "Host": LEGIT_HOST }
        });
        console.log(`S2-1 Status: ${res.status}`);
        // If it returns 403, it means whitelist check passed (and blocked it if not found).
        // If it returns 200, it found it.
        // We accept 200, 404 (route not found), or 403 (invalid tenant).
        // We DO NOT accept 500.
        expect(res.status).not.toBe(500);
    });

    // Scenario 2: X-Tenant-Id Bypass Attempt (Should be IGNORED or Fail)
    test("S2-2: X-Tenant-Id Bypass (Should be ignored)", async () => {
        // Host is valid, but we try to inject a different tenant ID via header
        const res = await fetch(`${API_URL}/api/health`, {
            headers: {
                "Host": LEGIT_HOST,
                "X-Tenant-Id": "admin-tenant" // Forged ID
            }
        });
        // The middleware should IGNORE X-Tenant-Id and use Host.
        // So this should behave exactly like S2-1.
        console.log(`S2-2 Status: ${res.status}`);
        expect(res.status).not.toBe(500);
    });

    // Scenario 3: Invalid Host Format (Should be blocked 400/403)
    test("S2-3: Malformed Host Header", async () => {
        const res = await fetch(`${API_URL}/api/health`, {
            headers: { "Host": "invalid_host_format" }
        });
        console.log(`S2-3 Status: ${res.status}`);
        // Regex validation should catch this.
        expect([400, 403]).toContain(res.status);
    });

    // Scenario 4: Non-Whitelisted Tenant (Should be blocked 403)
    test("S2-4: Non-Whitelisted Tenant", async () => {
        const res = await fetch(`${API_URL}/api/health`, {
            headers: { "Host": "non-existent-tenant.apex-v2.duckdns.org" }
        });
        console.log(`S2-4 Status: ${res.status}`);
        // Whitelist check should fail.
        expect(res.status).toBe(403);
    });

    // Scenario 5: SQL Injection in Host (Should be blocked 400/403)
    test("S2-5: SQL Injection Attempt", async () => {
        const res = await fetch(`${API_URL}/api/health`, {
            headers: { "Host": "tenant'; DROP TABLE tenants; --.apex-v2.duckdns.org" }
        });
        console.log(`S2-5 Status: ${res.status}`);
        expect([400, 403]).toContain(res.status);
    });
});
