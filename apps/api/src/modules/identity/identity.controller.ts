import { Controller, Post, Body, Res, UnauthorizedException, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityService } from './identity.service';
import { SkipTenantScope } from '@apex/security';
import type { FastifyReply } from 'fastify';
import { Throttle } from '@nestjs/throttler';

@Controller('identity')
@SkipTenantScope()
export class IdentityController {
    private readonly cookieDomain: string;

    constructor(
        private readonly identityService: IdentityService,
        private readonly configService: ConfigService
    ) {
        this.cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || '.60sec.shop';
    }

    @Post('register')
    @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 🔒 [SEC-L4] 10 registrations per hour
    async register(@Req() req: any, @Body() body: any, @Res({ passthrough: true }) res: FastifyReply) {
        const tenantId = body.tenantId || req.headers['x-apex-tenant-id'] || req.headers['x-apex-tenant-subdomain'] || req.tenantSubdomain;
        console.log(`🚀 Final Sync Check - TenantId found: ${tenantId}`);
        const { user, token } = await this.identityService.register({ ...body, tenantId });

        // FIX-014: Session Regeneration (Clear before set)
        res.clearCookie('apex_session', {
            path: '/',
            domain: this.cookieDomain,
        });

        res.setCookie('apex_session', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax', // CRITICAL: Changed to 'lax' for cross-subdomain compatibility
            domain: this.cookieDomain,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return {
            success: true,
            user
        };
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: FastifyReply) {
        // @ts-ignore
        res.clearCookie('apex_session', {
            path: '/',
            domain: this.cookieDomain
        });
        return { success: true };
    }

    @Post('verify')
    async verify(@Body('token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }
        return this.identityService.verifyEmail(token);
    }

    @Get('me')
    async me(@Req() req: any) {
        const user = req.user || { authenticated: false };
        return this.identityService.getProfileWithStats(user);
    }

    @Post('update')
    async update(@Req() req: any, @Body() body: any) {
        if (!req.user?.id) throw new UnauthorizedException();
        return this.identityService.updateProfile(req.user.id, body);
    }
}
