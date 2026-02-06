import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IdentityService } from '../../modules/identity/identity.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly identityService: IdentityService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Extract from HttpOnly Cookie
        const token = request.cookies?.apex_session;

        if (!token) {
            throw new UnauthorizedException('Session not found');
        }

        // 2. Verify JWT
        const payload = this.identityService.verifyJwt(token);
        if (!payload) {
            throw new UnauthorizedException('Invalid or expired session');
        }

        // 3. Attach User Context
        request.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            securityVersion: payload.securityVersion
        };

        // 4. Multi-Tenant Enforcement: User must match request tenant context (if applicable)
        if (request.tenantId && request.user.tenantId && request.tenantId !== request.user.tenantId) {
            throw new UnauthorizedException('Unauthorized tenant context');
        }

        return true;
    }
}
