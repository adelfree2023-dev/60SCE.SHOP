import { pgTable, serial, varchar, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const onboardingBlueprints = pgTable('onboarding_blueprints', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).unique().notNull(),
    config: jsonb('config').notNull(),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
