import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    subdomain: varchar('subdomain', { length: 255 }).notNull().unique(),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    ownerEmailHash: varchar('owner_email_hash', { length: 64 }).unique(),
    adminPasswordHash: varchar('admin_password_hash', { length: 255 }),
    status: varchar('status', { length: 50 }).default('active'),
    planId: varchar('plan_id', { length: 50 }).default('basic'),
    logoUrl: varchar('logo_url', { length: 255 }),
    primaryColor: varchar('primary_color', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
});
