import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    subdomain: varchar('subdomain', { length: 255 }).notNull().unique(),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    ownerEmailHash: varchar('owner_email_hash', { length: 64 }).unique(),
    adminPasswordHash: text('admin_password_hash'),
    status: varchar('status', { length: 50 }).default('active'),
    planId: varchar('plan_id', { length: 50 }).default('basic'),
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
