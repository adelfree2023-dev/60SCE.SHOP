// Set dummy env vars for Zod validation in @apex/config
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_ACCESS_KEY = 'minio';
process.env.MINIO_SECRET_KEY = 'minio123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ProvisioningController } from './provisioning.controller';

describe('ProvisioningController', () => {
    let controller: ProvisioningController;
    let mockService: any;
    let mockConfigService: any;

    beforeEach(() => {
        mockService = {
            provisionTenant: mock(() => Promise.resolve({ success: true, id: 'tenant_123' })),
            handleWebhookEvent: mock(() => Promise.resolve({ received: true })),
            validateSubdomain: mock(() => Promise.resolve(true)),
        };

        mockConfigService = {
            get: mock((key: string) => {
                if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
                return null;
            })
        };

        controller = new ProvisioningController(mockService, mockConfigService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createTenant', () => {
        it('should call provisioningService.provisionTenant', async () => {
            const dto: any = {
                subdomain: 'test',
                ownerEmail: 'test@example.com',
            };

            const result = await controller.createTenant(dto);

            expect(mockService.provisionTenant).toHaveBeenCalledWith(dto);
            expect(result).toEqual({ success: true, id: 'tenant_123' });
        });
    });

    describe('handleStripeWebhook', () => {
        it('should return received: true', async () => {
            const payload = { type: 'checkout.session.completed', id: 'evt_123' };
            const signature = require('crypto')
                .createHmac('sha256', 'whsec_test')
                .update(JSON.stringify(payload))
                .digest('hex');

            const result = await controller.handleStripeWebhook(payload, signature);
            expect(result).toEqual({ received: true });
            expect(mockService.handleWebhookEvent).toHaveBeenCalled();
        });
    });
});
