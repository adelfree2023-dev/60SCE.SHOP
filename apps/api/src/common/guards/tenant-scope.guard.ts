import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantScopeGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Check for SkipTenantValidation decorator
        const skipTenant = this.reflector.get<boolean>('skipTenantValidation', context.getHandler()) ||
            this.reflector.get<boolean>('skipTenantValidation', context.getClass());
        if (skipTenant) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // [SEC] Context Extraction
        const requestedTenantId = request.tenantId || request.tenant?.id;

        // [SEC] S9: Null user check - Strict Deny by Default
        if (!user) {
            const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler()) ||
                this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getClass());

            if (isPublic) return true;
            
            throw new ForbiddenException('Anonymous access denied to strict tenant scope');
        }

        // [SEC] S9: Super Admin bypass - CORRECT role value from database
        if (user.role === 'super-admin') return true;

        // [SEC] S4: Tenant Isolation Enforcement
        if (user.tenantId && requestedTenantId && String(user.tenantId) !== String(requestedTenantId)) {
            throw new ForbiddenException('Cross-tenant access denied');
        }

        return true;
    }
}
