import { SuperAdminGuard } from './super-admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('SuperAdminGuard', () => {
    let guard: SuperAdminGuard;

    beforeEach(() => {
        guard = new SuperAdminGuard();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow super-admin role', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { role: 'super-admin' }
                })
            })
        } as unknown as ExecutionContext;

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow isSuperAdmin flag', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { isSuperAdmin: true }
                })
            })
        } as unknown as ExecutionContext;

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny non-super-admin user', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { role: 'merchant', id: 'user-1' }
                })
            })
        } as unknown as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny missing user', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: null
                })
            })
        } as unknown as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
});
