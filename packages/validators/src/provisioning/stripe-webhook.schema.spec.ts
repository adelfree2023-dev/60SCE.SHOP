import { describe, it, expect } from 'bun:test';
import { StripeWebhookSchema } from './stripe-webhook.schema';

describe('StripeWebhookSchema (S3)', () => {
    it('should validate correct webhook payload', () => {
        const payload = {
            id: 'evt_123',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_123',
                    customer_email: 'customer@example.com',
                    amount_total: 1000,
                    currency: 'usd',
                    metadata: {
                        planId: 'pro'
                    }
                }
            },
            created: 1234567890,
            livemode: true
        };
        const result = StripeWebhookSchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
        const payload = {
            id: 'evt_123',
            object: 'event',
            type: 'invalid.type',
            data: {},
            created: 1234567890,
            livemode: true
        };
        const result = StripeWebhookSchema.safeParse(payload);
        expect(result.success).toBe(false);
    });
});
