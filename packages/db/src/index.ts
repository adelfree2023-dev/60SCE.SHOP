import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@apex/config";
import format from 'pg-format';
import { sql } from "drizzle-orm";

const queryClient = postgres(env.DATABASE_URL);
export const db = drizzle(queryClient);

/**
 * [SEC-L4] Secure Tenant Context Switch
 */
export async function setSchemaPath(tenantId: string) {
    // 🛡️ [SEC-L4] Strict Format Validation
    // 🛡️ [SEC-L4] Strict UUID Validation (Prevents SQL Injection at entry)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
        throw new Error('Invalid tenant ID format (must be UUID)');
    }

    // 🛡️ [SEC-L4] Safe Identifier Quoting using pg-format
    // We treat the output of format() as raw SQL because it guarantees safety.
    const safeSchema = format('%I', `tenant_${tenantId}`);
    await db.execute(sql.raw(`SET search_path TO ${safeSchema}, public`));
}

export async function createTenantSchema(tenantId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
        throw new Error('Invalid tenant ID format (must be UUID)');
    }
    const safeSchema = format('%I', `tenant_${tenantId}`);
    await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${safeSchema}`));
}

export const setTenantContext = setSchemaPath; // Alias for backward compatibility

export async function setSchemaPathUnsafe(schemaName: string) {
    if (!/^[a-z0-9_]+$/.test(schemaName)) {
        throw new Error('Invalid schema name - SQL injection risk');
    }
    const safeSchema = format('%I', schemaName);
    await db.execute(sql.raw(`SET search_path TO ${safeSchema}, public`));
}

export function tenantTable(tenantId: string, tableName: string): string {
    return `"tenant_${tenantId}".${tableName}`;
}

export * from "drizzle-orm";
export * from "./schema/audit-logs";
export * from "./schema/tenants";
export * from "./schema/addresses";
export * from "./schema/wallet-transactions";
export * from "./schema/wishlist";
export * from "./schema/support-tickets";
export * from "./schema/user-sessions";
