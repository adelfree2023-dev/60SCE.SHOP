import { z } from 'zod';

export const StripeWebhookSchema = z.object({
    id: z.string(),
    object: z.literal('event'),
    type: z.enum([
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.deleted',
    ]),
    data: z.object({
        object: z.object({
            id: z.string(),
            client_reference_id: z.string().optional(),
            customer_email: z.string().email(),
            amount_total: z.number(),
            currency: z.string(),
            metadata: z.object({
                planId: z.string().optional(),
                blueprintId: z.string().optional(),
            }).optional(),
        }),
    }),
    created: z.number(),
    livemode: z.boolean(),
});

export type StripeWebhookData = z.infer<typeof StripeWebhookSchema>;

export const WebhookSignatureSchema = z.object({
    signature: z.string(),
    payload: z.string(),
    secret: z.string(),
});

export type WebhookSignatureData = z.infer<typeof WebhookSignatureSchema>;
