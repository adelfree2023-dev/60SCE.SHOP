import { Controller, Post, Body, Res, UnauthorizedException, Logger, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IdentityService } from '../identity/identity.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SkipTenantScope } from '@apex/security';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    private readonly cookieDomain: string;

    constructor(
        private readonly identityService: IdentityService,
        private readonly configService: ConfigService
    ) {
        this.cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || '.60sec.shop';
    }

    @SkipTenantScope()
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // [SEC] S6: 5 login attempts per minute
    @Post('login')
    async login(
        @Req() req: any,
        @Body() body: any,
        @Res() res: FastifyReply
    ) {
        const { email, password } = body;
        const tenantId = body.tenantId || req.headers['x-apex-tenant-id'] || req.headers['x-apex-tenant-subdomain'] || req.tenantSubdomain;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';



        try {
            // FIX-014: Session Regeneration (Clear before set)
            res.clearCookie('apex_session', {
                path: '/',
                domain: this.cookieDomain,
                httpOnly: true,
                secure: true
            });

            const { user, token } = await this.identityService.login(email, password, tenantId);

            res.setCookie('apex_session', token, {
                httpOnly: true,
                secure: true, // Force secure in production/dev for consistency
                sameSite: 'lax', // CRITICAL: Changed to 'lax' for cross-subdomain compatibility
                path: '/',
                domain: this.cookieDomain,
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            // CRITICAL-007: Implementation of X-CSRF-Token in body
            const csrfToken = crypto.randomBytes(32).toString('hex');

            return res.send({
                success: true,
                csrfToken, // Clients should store this and send in X-CSRF-Token header
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenant_id
                }
            });
        } catch (error: any) {
            this.logger.error(`Login failed for ${email} from ${clientIp}: ${error.message}`);

            throw new UnauthorizedException('Invalid credentials');
        }
    }

    @Post('logout')
    async logout(@Res() res: FastifyReply) {
        res.clearCookie('apex_session', {
            path: '/',
            domain: this.cookieDomain,
            httpOnly: true,
            secure: true
        });
        return res.send({ success: true });
    }

    @Get('me')
    async getMe(@Req() req: any) {
        const user = req.user;
        if (!user) throw new UnauthorizedException();
        return { user };
    }
}
