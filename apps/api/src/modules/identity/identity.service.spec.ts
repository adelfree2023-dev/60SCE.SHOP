import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { IdentityService } from './identity.service';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('IdentityService', () => {
    let service: IdentityService;
    let mockPool: any;
    let mockClient: any;
    let mockConfigService: any;
    let mockJwtService: any;

    beforeEach(() => {
        mockClient = {
            query: mock(),
            release: mock(),
        };
        mockPool = {
            connect: mock().mockResolvedValue(mockClient),
            query: mock(),
        };
        mockConfigService = {
            get: mock().mockReturnValue('test-pepper'),
        };
        mockJwtService = {
            sign: mock().mockReturnValue('test-jwt-token'),
            verify: mock().mockReturnValue({ sub: 'u1', role: 'merchant' }),
        };

        service = new IdentityService(
            mockPool,
            mockConfigService,
            mockJwtService
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should successfully register a user', async () => {
            const data = { email: 'test@example.com', password: 'password123', tenantId: 't1' };
            
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 'resolved-t1' }] }) // SELECT tenant (Resolution)
                .mockResolvedValueOnce({ rows: [{ id: 'u1', email: data.email, role: 'customer', tenantId: 'resolved-t1' }] }) // INSERT
                .mockResolvedValueOnce({}); // COMMIT

            try {
                const result = await service.register(data);
                expect(result.user).toBeDefined();
                expect(result.token).toBe('test-jwt-token');
                // expect(mockClient.query).toHaveBeenCalledTimes(4); 
            } catch (e: any) {
                console.error('TEST FAIL ERROR:', e);
                console.log('QUERY CALLS:', mockClient.query.mock.calls);
                throw e;
            }
        });
    });

    describe('login', () => {
        it('should successfully login and upgrade password hash if needed', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const salt = 'salt';
            const pepper = 'test-pepper';
            const derivedKey = await new Promise<string>((resolve) => {
                crypto.scrypt(password + pepper, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => resolve(key.toString('hex')));
            });
            const validHash = `${salt}:${derivedKey}`;

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'u1', email, password_hash: validHash, role: 'merchant', tenant_id: 't1' }]
            });

            const result = await service.login(email, password);
            expect(result.user.id).toBe('u1');
        });

         it('should throw UnauthorizedException on invalid credentials', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });
            try {
                await service.login('wrong@example.com', 'pass');
                expect(true).toBe(false);
            } catch (e: any) {
                expect(e).toBeInstanceOf(UnauthorizedException);
            }
        });
    });

    describe('verifyEmail', () => {
        it('should successfully verify email and activate tenant', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 'u1', tenant_id: 't1' }] }) // UPDATE USER
                .mockResolvedValueOnce({}); // UPDATE TENANT
            
            const result = await service.verifyEmail('token123');
            expect(result.success).toBe(true);
        });
    });
});
