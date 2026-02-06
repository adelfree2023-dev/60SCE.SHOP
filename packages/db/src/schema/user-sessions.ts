import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * User Sessions Table (Global Schema - public)
 * Tracks active login sessions for "Active Devices" security feature
 */
export const userSessions = pgTable('user_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References public.users
    deviceName: varchar('device_name', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
    userAgent: text('user_agent'),
    lastActive: timestamp('last_active').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at'),
});
