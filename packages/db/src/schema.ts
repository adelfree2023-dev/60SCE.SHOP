import { pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Public Schema Tables (Tenant Management)
export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    subdomain: text('subdomain').notNull().unique(),
    name: text('name').notNull(),
    plan: text('plan').notNull().default('free'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: text('metadata'), // JSONB stringified or used as text for simplicity
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Tenant-Specific Schema Tables
// Note: These will be created inside tenant_XXX schemas
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    role: text('role').notNull().default('user'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const stores = pgTable('stores', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    subdomain: text('subdomain').notNull(),
    status: text('status').notNull().default('active'),
    plan: text('plan').notNull().default('free'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
