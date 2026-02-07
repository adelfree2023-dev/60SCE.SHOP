/**
 * Authentication & Authorization Module
 * S2: Tenant Isolation Enforcement via TenantScopedGuard
 */

import { type TenantContext, getCurrentTenantContext } from '@apex/middleware';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
    impersonating?: boolean;
  };
  tenantId: string;
}

@Injectable()
export class TenantScopedGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Extract JWT from cookie or header
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    // 2. Verify JWT
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // 3. S2: Retrieve verified tenant context from middleware
    // This ensures the middleware has already validated the tenant
    let tenantContext: TenantContext;
    try {
      tenantContext = getCurrentTenantContext();
    } catch {
      throw new ForbiddenException(
        'S2 Violation: No active tenant context found'
      );
    }

    const requestedTenantId = tenantContext.tenantId;

    // 4. S2: Strict Tenant Isolation Check
    // User can ONLY access their own tenant (unless impersonating as Super Admin)
    if (
      request.user.tenantId !== requestedTenantId &&
      !request.user.impersonating
    ) {
      // Log security event (S4 Audit)
      console.error(
        `🚨 S2 Violation: User ${request.user.userId} from tenant ${request.user.tenantId} attempted to access tenant ${requestedTenantId}`
      );

      throw new ForbiddenException(
        'S2 Isolation Violation: Cross-tenant access denied'
      );
    }

    // 5. Set tenant context for downstream use
    request.tenantId = requestedTenantId;

    return true;
  }

  private extractToken(request: Request): string | undefined {
    // Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check httpOnly cookie
    return request.cookies?.jwt;
  }
}

/**
 * Super Admin Guard (for God Mode)
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super Admin access required');
    }

    return true;
  }
}

/**
 * JWT Strategy Configuration
 */
export const JwtStrategyConfig = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
