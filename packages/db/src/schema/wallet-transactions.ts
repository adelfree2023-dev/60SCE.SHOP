import { pgTable, uuid, varchar, text, decimal, timestamp } from 'drizzle-orm/pg-core';

/**
 * Wallet Transactions Table (Tenant Schema)
 * Tracks all credit/debit operations for customer store credit
 */
export const walletTransactions = pgTable('wallet_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References public.users
    type: varchar('type', { length: 20 }).notNull(), // 'credit', 'debit', 'refund'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    referenceId: uuid('reference_id'), // order_id or admin action ID
    referenceType: varchar('reference_type', { length: 50 }), // 'order', 'refund', 'gift', 'adjustment'
    createdBy: uuid('created_by'), // Admin who made the adjustment (for audit)
    createdAt: timestamp('created_at').defaultNow(),
});
