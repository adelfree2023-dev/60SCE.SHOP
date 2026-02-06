import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pool } from 'pg';
import * as crypto from 'crypto';

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
    private static pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // [SEC] S4: Integrity Protection
    private readonly auditSecret: string;

    constructor() {
        this.auditSecret = process.env.AUDIT_SECRET || '';
        if (this.auditSecret.length < 32) {
            console.error('❌ FATAL: AUDIT_SECRET for tamper-proof signing is unsafe or missing.');
            process.exit(1);
        }
    }

    private static readonly PII_FIELDS = [
        'password', 'token', 'secret', 'apiKey', 'cvv', 'creditCard',
        'email', 'phone', 'address', 'fullName', 'firstName', 'lastName',
        'ssn', 'taxId', 'iban', 'routingNumber', 'accountNumber', 'stripe',
        'birthDate', 'passportNumber', 'nationalId', 'driverLicense', 'taxid',
        'zipCode', 'postalCode', 'city', 'state', 'country', 'latitude', 'longitude'
    ];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user?.id || 'anonymous';
        const tenantId = request.tenantId || null;
        const routePath = request.route?.path || request.url || 'unknown';
        const action = `${request.method}:${routePath}`;
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: (data: any) => {
                    this.logAudit({
                        tenantId,
                        userId: user,
                        action,
                        status: 'success',
                        duration: Date.now() - startTime,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                        payload: this.sanitizePayload(request.body),
                        response: this.sanitizeResponse(data),
                    });
                },
                error: (error: any) => {
                    this.logAudit({
                        tenantId,
                        userId: user,
                        action,
                        status: 'error',
                        duration: Date.now() - startTime,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                        payload: this.sanitizePayload(request.body),
                        error: error.message,
                    });
                },
            }),
        );
    }

    private async logAudit(entry: any) {
        try {
            // [SEC] S4: Digital Signature (HMAC-SHA256)
            // Ensures records cannot be modified without detection
            const signatureContent = `${entry.tenantId}|${entry.userId}|${entry.action}|${entry.status}|${entry.payload}|${entry.ipAddress}`;
            const signature = crypto
                .createHmac('sha256', this.auditSecret)
                .update(signatureContent)
                .digest('hex');

            await AuditLoggerInterceptor.pool.query(`
                INSERT INTO public.audit_logs 
                (tenant_id, user_id, action, status, duration, ip_address, user_agent, payload, response, error, signature, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            `, [
                entry.tenantId || 'system',
                entry.userId,
                entry.action,
                entry.status,
                entry.duration,
                entry.ipAddress,
                entry.userAgent,
                entry.payload,
                entry.response,
                entry.error,
                signature
            ]);
        } catch (e) {
            console.error('🔥 AUDIT LOG FAILURE - SECURITY INCIDENT', e);
        }
    }

    private sanitizePayload(payload: any) {
        if (!payload || typeof payload !== 'object') return payload;
        return JSON.stringify(this.sanitizeObject(payload));
    }

    private sanitizeResponse(response: any) {
        if (!response || typeof response !== 'object') return response;
        return JSON.stringify(this.sanitizeObject(response));
    }

    private sanitizeObject(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.sanitizeObject(item));

        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                const isPII = AuditLoggerInterceptor.PII_FIELDS.some(pii => key.toLowerCase().includes(pii.toLowerCase()));
                if (isPII) return [key, '[REDACTED]'];
                if (typeof value === 'object') return [key, this.sanitizeObject(value)];
                return [key, value];
            })
        );
    }
}
