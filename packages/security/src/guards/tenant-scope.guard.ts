import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_TENANT_SCOPE_KEY } from '../decorators/skip-tenant-scope.decorator';

@Injectable()
export class TenantScopeGuard implements CanActivate {
    private readonly logger = new Logger(TenantScopeGuard.name);

    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isSkipTenantScope = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_SCOPE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isSkipTenantScope) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        if (!request.user) {
            return true; // Public route behavior (handled by AuthGuard usually)
        }

        // Super Admin Bypass - MOVED UP BEFORE TENANT CHECK
        if (request.user.role === 'super_admin') {
            return true;
        }

        const tenantId = request.tenantId || request.raw?.tenantId;
        const userTenantId = request.user.tenantId;

        if (!tenantId) {
            this.logger.error('🚨 Tenant Context Missing on scoped route');
            throw new ForbiddenException('Tenant context required');
        }

        // Cross-tenant check
        if (tenantId !== userTenantId) {
            this.logger.error(`🚨 Cross-tenant access attempt: User ${request.user.id} (T: ${userTenantId}) -> Target (T: ${tenantId})`);
            throw new ForbiddenException('Access Denied: Cross-tenant operation');
        }

        return true;
    }
}
