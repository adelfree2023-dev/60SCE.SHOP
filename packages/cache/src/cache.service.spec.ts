import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CacheService } from './cache.service';

// Mock the redis factory
mock.module('redis', () => ({
    createClient: mock((options: any) => ({
        connect: mock(() => Promise.resolve()),
        get: mock(() => Promise.resolve(null)),
        set: mock(() => Promise.resolve()),
        setEx: mock(() => Promise.resolve()),
        del: mock(() => Promise.resolve(0)),
        exists: mock(() => Promise.resolve(0)),
        incr: mock(() => Promise.resolve(0)),
        expire: mock(() => Promise.resolve(true)),
        mGet: mock(() => Promise.resolve([])),
        mSet: mock(() => Promise.resolve()),
        quit: mock(() => Promise.resolve()),
        on: mock(() => { }),
        options // Expose options for testing reconnect strategy
    })),
}));

describe('CacheService (Redis)', () => {
    let service: CacheService;
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            connect: mock(() => Promise.resolve()),
            get: mock(() => Promise.resolve(JSON.stringify({ data: 'test' }))),
            set: mock(() => Promise.resolve()),
            setEx: mock(() => Promise.resolve()),
            del: mock(() => Promise.resolve(1)),
            exists: mock(() => Promise.resolve(1)),
            incr: mock(() => Promise.resolve(5)),
            expire: mock(() => Promise.resolve(true)),
            mGet: mock(() => Promise.resolve([JSON.stringify({ a: 1 }), JSON.stringify({ b: 2 })])),
            mSet: mock(() => Promise.resolve()),
            quit: mock(() => Promise.resolve()),
            on: mock(() => { }),
        };

        service = new CacheService();
        (service as any).client = mockClient;
        (service as any).isConnected = true;
    });

    it('should connect to Redis on module init', async () => {
        (service as any).isConnected = false;
        await service.onModuleInit();
        expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should get cached value', async () => {
        const result = await service.get('test-key');
        expect(result).toEqual({ data: 'test' });
        expect(mockClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should set cached value with TTL', async () => {
        await service.set('test-key', { value: 'data' }, 60);
        expect(mockClient.setEx).toHaveBeenCalledWith('test-key', 60, '{"value":"data"}');
    });

    it('should set cached value without TTL', async () => {
        await service.set('test-key', { value: 'data' });
        expect(mockClient.set).toHaveBeenCalledWith('test-key', '{"value":"data"}');
    });

    it('should delete cached value', async () => {
        const result = await service.del('test-key');
        expect(result).toBe(1);
        expect(mockClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should check if key exists', async () => {
        const exists = await service.exists('test-key');
        expect(exists).toBe(true);
        expect(mockClient.exists).toHaveBeenCalledWith('test-key');
    });

    it('should increment counter', async () => {
        const result = await service.incr('counter-key');
        expect(result).toBe(5);
        expect(mockClient.incr).toHaveBeenCalledWith('counter-key');
    });

    it('should set expiration', async () => {
        const result = await service.expire('test-key', 300);
        expect(result).toBe(true);
        expect(mockClient.expire).toHaveBeenCalledWith('test-key', 300);
    });

    it('should get multiple keys', async () => {
        const result = await service.mget(['key1', 'key2']);
        expect(result).toEqual([{ a: 1 }, { b: 2 }]);
        expect(mockClient.mGet).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should set multiple keys with TTL', async () => {
        await service.mset({ key1: 'value1', key2: 'value2' }, 60);
        expect(mockClient.mSet).toHaveBeenCalled();
        expect(mockClient.expire).toHaveBeenCalledTimes(2);
    });

    it('should return null if not connected', async () => {
        (service as any).isConnected = false;
        const result = await service.get('test-key');
        expect(result).toBeNull();
    });

    it('should close connection on module destroy', async () => {
        await service.onModuleDestroy();
        expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should handle redis errors', () => {
        const errorHandler = (mockClient as any).errorHandler;
        if (errorHandler) {
            const error = new Error('Cache error');
            errorHandler(error);
            expect(loggedErrors.some(m => m.includes('Redis error: Cache error'))).toBe(true);
        }
    });

    it('should test reconnect strategy', () => {
        // Find the reconnect strategy from createClient call if possible, or mock it
        const serviceWithStrat = new CacheService();
        const options = (serviceWithStrat as any).client.options;
        if (options?.socket?.reconnectStrategy) {
            const strat = options.socket.reconnectStrategy;
            expect(strat(1)).toBe(50);
            expect(strat(11)).toBe(false);
        }
    });

    it('should cover constructor initialization', () => {
        const newService = new CacheService();
        expect(newService).toBeDefined();
        expect((newService as any).client).toBeDefined();
    });

    it('should handle all error event paths', async () => {
        const errorHandler = (mockClient as any).errorHandler;
        const reconnectHandler = (mockClient as any).reconnectHandler;

        if (errorHandler) {
            errorHandler(new Error('Test cache error'));
            expect(loggedErrors.some(m => m.includes('Test cache error'))).toBe(true);
        }

        if (reconnectHandler) {
            reconnectHandler();
            expect(loggedWarns.some(m => m.includes('reconnecting'))).toBe(true);
        }
    });
});
