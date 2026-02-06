import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { BlueprintsService } from './blueprints.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BlueprintsService (Super-#21)', () => {
    let service: BlueprintsService;
    let mockPool: any;

    beforeEach(() => {
        mockPool = {
            query: mock(() => Promise.resolve({ rows: [] })),
        };
        service = new BlueprintsService();
        (service as any).pool = mockPool;
    });

    it('should fetch all blueprints', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [
                { id: '1', name: 'Default', is_default: true, created_at: new Date() },
                { id: '2', name: 'Custom', is_default: false, created_at: new Date() },
            ],
        });

        const result = await service.findAll();
        expect(result).toHaveLength(2);
        expect(result[0].is_default).toBe(true);
    });

    it('should find one blueprint by id', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'Test Blueprint', config: {} }],
        });

        const result = await service.findOne('1');
        expect(result.name).toBe('Test Blueprint');
    });

    it('should throw NotFoundException if blueprint not found', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should create a new blueprint', async () => {
        // Only INSERT query when is_default=false (no UPDATE needed)
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'New Blueprint', is_default: false, config: {} }],
        });

        const createDto = {
            name: 'New Blueprint',
            config: { steps: [] },
            is_default: false,
        };

        const result = await service.create(createDto);
        expect(result.name).toBe('New Blueprint');
        expect(mockPool.query).toHaveBeenCalledTimes(1); // Only INSERT
    });

    it('should clear other defaults when creating default blueprint', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] }); // Clear defaults
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'New Default', is_default: true }],
        });

        const createDto = {
            name: 'New Default',
            config: { steps: [] },
            is_default: true,
        };

        await service.create(createDto);

        expect(mockPool.query).toHaveBeenCalledTimes(2);
        expect(mockPool.query.mock.calls[0][0]).toContain('SET is_default = false');
    });

    it('should update blueprint', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'Old Name', is_default: false }],
        });
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'New Name', is_default: false }],
        });

        const result = await service.update('1', { name: 'New Name' });
        expect(result.name).toBe('New Name');
    });

    it('should prevent deletion of default blueprint', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '1', name: 'Default', is_default: true }],
        });

        await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });

    it('should delete non-default blueprint', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '2', name: 'Custom', is_default: false }],
        });
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: '2', name: 'Custom' }],
        });

        const result = await service.remove('2');
        expect(result.success).toBe(true);
        expect(result.id).toBe('2');
    });
});
