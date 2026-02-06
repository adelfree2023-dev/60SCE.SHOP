import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { join } from 'path';

// Mock fs/promises BEFORE import
const mockWriteFile = mock(() => Promise.resolve());
const mockMkdir = mock(() => Promise.resolve());

mock.module('fs/promises', () => ({
    writeFile: mockWriteFile,
    mkdir: mockMkdir
}));

describe('TraefikRouterService', () => {
    let TraefikRouterService: any;
    let service: any;

    beforeEach(async () => {
        mockWriteFile.mockClear();
        mockMkdir.mockClear();

        const module = await import('./traefik-router.service');
        TraefikRouterService = module.TraefikRouterService;
        service = new TraefikRouterService();
    });

    it('should generate and write yaml config', async () => {
        const subdomain = 'myshop';
        await service.createRoute(subdomain);

        expect(mockMkdir).toHaveBeenCalled();
        expect(mockWriteFile).toHaveBeenCalled();

        const [path, content] = mockWriteFile.mock.lastCall;
        expect(path).toContain(`${subdomain}-route.yml`);
        expect(content).toContain(`Host(\`${subdomain}.apex.localhost\`)`);
        expect(content).toContain('X-Tenant-Id: myshop');
    });

    it('should handle file write errors', async () => {
        mockWriteFile.mockRejectedValueOnce(new Error('Permission denied'));
        try {
            await service.createRoute('fail');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toContain('Permission denied');
        }
    });

    it('should handle removal errors gracefully', async () => {
        // removeRoute logs error but doesn't throw
        // This is a bit tricky to test without spying on logger, but we can ensure it doesn't crash
        await service.removeRoute('test');
    });
});
