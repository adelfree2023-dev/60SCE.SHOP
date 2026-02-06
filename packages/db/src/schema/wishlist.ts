import { pgTable, uuid, boolean, timestamp, unique, decimal } from 'drizzle-orm/pg-core';

/**
 * Wishlist Table (Tenant Schema)
 * Customer product wishlist with price drop notification preference
 */
export const wishlist = pgTable('wishlist', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References public.users
    productId: uuid('product_id').notNull(), // References tenant.products
    notifyOnSale: boolean('notify_on_sale').default(true),
    priceAtAdd: decimal('price_at_add', { precision: 10, scale: 2 }), // For price drop detection
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    userProductUnique: unique().on(table.userId, table.productId),
}));
