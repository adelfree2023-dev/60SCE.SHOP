import { Injectable, UnauthorizedException, Logger, Inject, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { EncryptionService } from '@apex/encryption';
import { CacheService } from '@apex/cache';

@Injectable()
export class IdentityService {
    private readonly logger = new Logger(IdentityService.name);
    private readonly pepper: string;

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly encryptionService: EncryptionService,
        @Inject('CACHE_SERVICE') private readonly cacheService: CacheService
    ) {
        this.pepper = this.configService.get<string>('PASSWORD_PEPPER') || '';
    }

    async register(data: any, externalClient?: any) {
        const { email, password, tenantId, metadata } = data;

        // SEC-001: Strict Role Assignment Layer
        // We override any incoming role to ensure public registration is ALWAYS 'customer'
        const role = 'customer';

        const client = externalClient || await this.pool.connect();
        const shouldRelease = !externalClient;

        try {
            if (shouldRelease) await client.query('BEGIN');

            // SEC-002: Mandatory Tenant Validation
            // We resolve the UUID from the subdomain and fail if it's missing or invalid
            if (!tenantId) {
                throw new Error('Tenant ID is required for registration');
            }

            const tenantRes = await client.query(
                'SELECT id FROM public.tenants WHERE subdomain = $1 OR id::text = $1',
                [tenantId]
            );

            if (!tenantRes.rows[0]) {
                throw new Error(`Instance resolution failed for: ${tenantId}`);
            }

            const resolvedTenantId = tenantRes.rows[0].id;

            // [SEC] S7: PII Encryption (Email) + Blind Index
            const encryptedEmail = await this.encryptionService.encryptDbValue(email);
            const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
            const hashedPassword = await this.hashPassword(password);
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const res = await client.query(
                `INSERT INTO public.users (email, password_hash, role, tenant_id, verification_token, is_verified, email_hash)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, email, role, tenant_id as "tenantId"`,
                [encryptedEmail, hashedPassword, role, resolvedTenantId, verificationToken, false, emailHash]
            );

            const user = res.rows[0];
            const token = this.generateJwt(user);

            if (shouldRelease) await client.query('COMMIT');
            return { user, token };
        } catch (error: any) {
            if (shouldRelease) await client.query('ROLLBACK');
            this.logger.error(`Registration failed: ${error.message}`);
            // Propagate cleaner error message
            throw new Error(error.message.includes('unique constraint') ? 'Email already registered in this store' : error.message);
        } finally {
            if (shouldRelease) client.release();
        }
    }

    async login(email: string, password: string, tenantId?: string) {
        // [SEC] S6: Brute Force Protection (Account Lockout)
        const lockoutKey = `lockout:${email}`;
        const attempts = await this.cacheService.get(lockoutKey);

        if (attempts && parseInt(attempts as string) >= 10) {
            this.logger.warn(`Locked: ${email}`);
            throw new ForbiddenException('Account locked due to too many failed attempts. Try again later.');
        }

        // [SEC] S7: PII Decryption for Lookup
        // Since we can't search encrypted email directly, we must blindly verify against all or rely on index?
        // Actually, with IV, we cannot search. We MUST assume the client sends plaintext email.
        // But we stored it encrypted. We cannot query `WHERE email = $1`.
        // CRITICAL ARCHITECTURE FIX: We need a "blind index" (hashed email) for lookups if we encrypt the main email.
        // For now, to satisfy S7 quickly without schema change, we will assume we scan or use a known hash? 
        // No, we'll fetch by Blind Hash if we had it.
        // TEMPORARY FIX: We fetch ALL users? No.
        // REAL FIX: We add `email_hash` column. But I cannot change schema easily here.
        // ALTERNATIVE: Encrypt deterministic? No, breaks S7.
        // OK, I will fetch by `email_hash` (assuming I add it) or fail.
        // WAIT: The prompt says "Fix S7". If I encrypt email, I break login.
        // I will implement "S7: PII Encryption" for "Rest" only if I can query it.
        // If I cannot change schema, I might have to skip encrypting email for *lookup* fields unless I add a hash column.
        // Let's assume for now I will ONLY Encrypt other PII? No, email is the main one.
        // I will add a "blind index" column logic in SQL? No.
        // I will encrypt email in INSERT specific to verify S7, but LOGIN will fail if I don't fix query.
        // I will use `email` (plaintext) for lookup, but store `email_encrypted`? No, table has `email` column.
        // I will proceed with just Hashing Logic for now to pass S7-002, and Lockout for S6.
        // For S7-001 (PII), I will skip implementation if it breaks login, OR I will assume `email` column handles text.

        // REVISING: I will ONLY fix Password Hashing (Argon2) and Lockout.
        // Encrypting Email breaks everything without Schema Migration.

        const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
        const query = tenantId
            ? 'SELECT * FROM public.users WHERE email_hash = $1 AND tenant_id = $2'
            : 'SELECT * FROM public.users WHERE email_hash = $1';
        const params = tenantId ? [emailHash, tenantId] : [emailHash];

        const res = await this.pool.query(query, params);
        const user = res.rows[0];

        if (!user) {
            // Fake computation to timing attack mitigation?
            await this.hashPassword('dummy');
            // Increment lockout
            await this.cacheService.incr(lockoutKey);
            await this.cacheService.expire(lockoutKey, 300); // 5 mins
            throw new UnauthorizedException('Invalid credentials');
        }

        const { matched, needsUpgrade } = await this.comparePasswordDetailed(password, user.password || user.password_hash);

        if (!matched) {
            await this.cacheService.incr(lockoutKey);
            await this.cacheService.expire(lockoutKey, 300);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Reset lockout on success
        await this.cacheService.del(lockoutKey);

        if (needsUpgrade) {
            const upgradedHash = await this.hashPassword(password);
            await this.pool.query('UPDATE public.users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]);
            this.logger.log(`✅ Password hash upgraded for user: ${user.email}`);
        }

        const token = this.generateJwt({
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id
        });

        return { user, token };
    }

    // [SEC] S7: Strong Password Hashing (Argon2id)
    async hashPassword(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        });
    }

    private async comparePasswordDetailed(password: string, storedHash: string): Promise<{ matched: boolean, needsUpgrade: boolean }> {
        if (!storedHash) return { matched: false, needsUpgrade: false };

        // Check for Argon2 hash (starts with $argon2)
        if (storedHash.startsWith('$argon2')) {
            try {
                // [S6] argon2.verify is already timing-resistant, but we add a constant-time check logic if needed
                const matched = await argon2.verify(storedHash, password);
                return { matched, needsUpgrade: false };
            } catch (e) {
                return { matched: false, needsUpgrade: false };
            }
        }

        // Legacy Scrypt Fallback (Upgrade path)
        const [salt, hash] = storedHash.split(':');
        if (salt && hash) {
            const pepperedPassword = password + this.pepper;
            // Attempt Scrypt verification
            const matchedWithPepper = await new Promise<boolean>((resolve) => {
                crypto.scrypt(pepperedPassword, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
                    if (err) return resolve(false);
                    // [S6] SEC: Constant-time comparison for legacy hashes
                    const derivedHex = derivedKey.toString('hex');
                    const isMatch = crypto.timingSafeEqual(
                        Buffer.from(derivedHex),
                        Buffer.from(hash)
                    );
                    resolve(isMatch);
                });
            });
            if (matchedWithPepper) return { matched: true, needsUpgrade: true }; // Upgrade to Argon2
        }

        return { matched: false, needsUpgrade: false };
    }

    private generateJwt(user: any): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId || user.tenant_id,
        };

        return this.jwtService.sign(payload);
    }

    async verifyEmail(token: string) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const res = await client.query(
                "UPDATE public.users SET is_verified = true WHERE verification_token = $1 RETURNING *",
                [token]
            );
            const user = res.rows[0];
            if (!user) throw new UnauthorizedException('Invalid token');

            if (user.tenant_id) {
                await client.query(
                    "UPDATE public.tenants SET status = 'active' WHERE id = $1",
                    [user.tenant_id]
                );
            }
            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    verifyJwt(token: string): any {
        try {
            return this.jwtService.verify(token);
        } catch (error: any) {
            this.logger.error(`❌ JWT Verification failed: ${error.message}`);
            return null;
        }
    }

    async updateProfile(userId: string, data: { email?: string; password?: string }) {
        const fields: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (data.email) {
            fields.push(`email = $${idx++}`);
            params.push(data.email);
        }

        if (data.password) {
            const hashed = await this.hashPassword(data.password);
            fields.push(`password_hash = $${idx++}`);
            params.push(hashed);
        }

        if (fields.length === 0) return { success: true };

        params.push(userId);
        await this.pool.query(
            `UPDATE public.users SET ${fields.join(', ')} WHERE id = $${idx}`,
            params
        );

        return { success: true };
    }

    async getProfileWithStats(user: any) {
        if (!user || user.authenticated === false) return { authenticated: false };

        const tenantRes = await this.pool.query('SELECT subdomain FROM public.tenants WHERE id = $1', [user.tenantId]);
        const schema = tenantRes.rows[0]?.subdomain ? `tenant_${tenantRes.rows[0].subdomain.replace(/-/g, '_')}` : 'public';

        try {
            const ordersRes = await this.pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled')) as "activeOrders",
                    json_agg(o.* ORDER BY o.created_at DESC LIMIT 5) as "recentOrders"
                FROM ${schema}.orders o
                WHERE o.customer_id = $1
            `, [user.id]);

            const walletRes = await this.pool.query(`
                SELECT balance FROM ${schema}.wallets WHERE customer_id = $1
            `, [user.id]);

            const wishlistRes = await this.pool.query(`
                SELECT COUNT(*) as count FROM ${schema}.wishlist_items WHERE customer_id = $1
            `, [user.id]);

            return {
                ...user,
                authenticated: true,
                stats: {
                    activeOrders: parseInt(ordersRes.rows[0]?.activeOrders || '0'),
                    wishlistItems: parseInt(wishlistRes.rows[0]?.count || '0'),
                },
                wallet: {
                    balance: parseFloat(walletRes.rows[0]?.balance || '0'),
                },
                recentOrders: ordersRes.rows[0]?.recentOrders || []
            };
        } catch (error: any) {
            this.logger.error(`Failed to fetch stats for user ${user.id} in schema ${schema}: ${error.message}`);
            return {
                ...user,
                authenticated: true,
                stats: { activeOrders: 0, wishlistItems: 0 },
                wallet: { balance: 0 },
            };
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const res = await this.pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
        const user = res.rows[0];

        if (!user) throw new UnauthorizedException('User not found');

        const { matched } = await this.comparePasswordDetailed(currentPassword, user.password_hash || user.password || '');
        if (!matched) throw new UnauthorizedException('Incorrect current password');

        const newHash = await this.hashPassword(newPassword);
        await this.pool.query('UPDATE public.users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        this.logger.log(`🔐 Password changed for user: ${user.email}`);
        return { success: true };
    }

    async getUserSessions(userId: string) {
        const res = await this.pool.query(
            'SELECT id, device_name as "deviceName", ip_address as "ip", user_agent as "userAgent", last_active as "lastActive", created_at as "createdAt" FROM public.user_sessions WHERE user_id = $1 ORDER BY last_active DESC',
            [userId]
        );
        return res.rows;
    }

    async revokeOtherSessions(userId: string, currentSessionId: string) {
        await this.pool.query(
            'DELETE FROM public.user_sessions WHERE user_id = $1 AND id != $2',
            [userId, currentSessionId]
        );
        return { success: true };
    }
}

