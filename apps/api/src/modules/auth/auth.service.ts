import { Injectable, UnauthorizedException, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '@apex/redis';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService
    ) { }

    // [SEC] S6: Progressive Rate Limiting & Lockout
    async checkLockout(email: string, ip: string): Promise<void> {
        const client = this.redisService.getClient();
        const key = `auth:lockout:${email}:${ip}`;
        const attempts = await client.get(key);

        if (attempts && parseInt(attempts) >= 5) {
            this.logger.warn(`🔒 Account locked for ${email} from ${ip}`);
            throw new ForbiddenException('Account temporarily locked due to multiple failed attempts. Please try again later.');
        }
    }

    async recordFailure(email: string, ip: string): Promise<void> {
        const client = this.redisService.getClient();
        const key = `auth:lockout:${email}:${ip}`;

        // Progressive Backoff: 1m, 5m, 15m, 1h
        const attempts = await client.incr(key);
        let ttl = 60; // Default 1 min

        if (attempts === 1) ttl = 60;
        else if (attempts === 5) ttl = 300; // 5 mins lock
        else if (attempts === 10) ttl = 900; // 15 mins
        else if (attempts >= 20) ttl = 3600; // 1 hour

        if (attempts === 1 || attempts === 5 || attempts === 10 || attempts === 20) {
            await client.expire(key, ttl);
        }

        this.logger.warn(`🚩 Auth failure for ${email} from ${ip} (Attempt ${attempts})`);
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.pool.query(
            'SELECT id, email, password_hash, role, tenant_id as "tenantId" FROM public.users WHERE email = $1',
            [email]
        ).then(res => res.rows[0]);

        if (user && await bcrypt.compare(pass, user.password_hash)) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        return {
            token: this.jwtService.sign(payload),
            user
        };
    }
}
