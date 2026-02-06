import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Support Tickets Table (Tenant Schema)
 * Customer support ticket management
 */
export const supportTickets = pgTable('support_tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References public.users
    orderId: uuid('order_id'), // Optional reference to related order
    subject: varchar('subject', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).default('open'), // 'open', 'pending', 'resolved', 'closed'
    priority: varchar('priority', { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
    assignedTo: uuid('assigned_to'), // Merchant staff member
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
});

/**
 * Support Ticket Messages Table (Tenant Schema)
 * Individual messages within a support ticket
 */
export const ticketMessages = pgTable('ticket_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull(), // References support_tickets
    senderType: varchar('sender_type', { length: 10 }).notNull(), // 'customer', 'merchant'
    senderId: uuid('sender_id').notNull(), // User ID of sender
    message: text('message').notNull(),
    attachmentUrl: varchar('attachment_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
});
