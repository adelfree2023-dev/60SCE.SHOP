import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * ARCH-S2 §4.2: Super Admin Guard
 * Restricts access to global administrative endpoints.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 🛡️ [SEC-L1] Strict Role Validation
        if (!user || (user.role !== 'super-admin' && user.isSuperAdmin !== true)) {
            const userId = user?.id || 'anonymous';
            throw new ForbiddenException(`Access restricted to Super Admin only (User: ${userId})`);
        }

        return true;
    }
}
