import { pgTable, uuid, varchar, text, boolean, timestamp, decimal } from 'drizzle-orm/pg-core';

/**
 * Customer Addresses Table (Tenant Schema)
 * [SEC] S7: PII fields (street, phone) are encrypted at rest using ENCRYPTION_KEY
 */
export const addresses = pgTable('addresses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References public.users
    label: varchar('label', { length: 50 }).notNull(), // 'home', 'work', 'family'
    recipientName: varchar('recipient_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 255 }).notNull(), // Encrypted
    street: text('street').notNull(), // Encrypted
    building: varchar('building', { length: 50 }),
    floor: varchar('floor', { length: 10 }),
    apartment: varchar('apartment', { length: 10 }),
    landmark: text('landmark'),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
