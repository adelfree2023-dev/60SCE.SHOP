import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * [FIX-017] Request ID Middleware
 * Assigns a unique ID to every incoming request for forensic tracing.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        const requestId = req.headers['x-request-id'] || randomUUID();

        // Attach to request for logging
        req.requestId = requestId;
        req.headers['x-request-id'] = requestId;

        // Attach to response for client/forensics
        if (typeof res.setHeader === 'function') {
            res.setHeader('X-Request-ID', requestId);
        } else if (typeof res.header === 'function') {
            res.header('X-Request-ID', requestId);
        }

        next();
    }
}
