import { pgTable, serial, varchar, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    tenantId: varchar('tenant_id', { length: 255 }),
    userId: varchar('user_id', { length: 255 }),
    action: varchar('action', { length: 255 }),
    status: varchar('status', { length: 50 }),
    duration: integer('duration'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    payload: text('payload'),
    response: text('response'),
    error: text('error'),
    signature: text('signature'), // [SEC-L4] Forensic Tamper-Evidence
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
