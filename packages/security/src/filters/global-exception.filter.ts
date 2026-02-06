import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

/**
 * ARCH-S1 §1.3: Global Exception Filter
 * Provides forensic logging and production error masking to prevent information leakage.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal Server Error';

        // 1. FORENSIC LOGGING (Internal Only)
        const requestId = request.headers?.['x-request-id'] || 'no-id';
        const tenant = (request as any).tenantSubdomain || 'public';
        const path = (request as any).url || request.url;

        // [SEC-019] Safe Serialization to prevent hangs on circular references
        const safeException = exception instanceof Error
            ? { message: exception.message, name: exception.name }
            : typeof exception === 'string' ? exception : 'Unknown Error';

        const logPayload = {
            requestId,
            tenant,
            timestamp: new Date().toISOString(),
            path,
            method: (request as any).method || 'UNKNOWN',
            status,
            exception: safeException,
        };

        if (status >= 500) {
            this.logger.error(`🚨 Fatal Error [${requestId}]: ${status} ${path}`);
        } else {
            this.logger.warn(`⚠️ Warning [${requestId}]: ${status} ${path}`);
        }

        // 2. [FIX-013] PRODUCTION ERROR MASKING
        const isProduction = process.env.NODE_ENV === 'production';
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path,
            message: (isProduction && status >= 500)
                ? 'An unexpected error occurred. Please contact support.'
                : typeof message === 'string' ? message : (message as any).message || 'Internal Server Error',
        };

        // 3. FASTIFY / NATIVE COMPATIBILITY (Optimized for performance/no-hang)
        try {
            // [SEC] ARCH-S1: No-Hang Dispatch Logic
            const raw = response.raw || response;

            if (response.status && typeof response.status === 'function' && response.send && typeof response.send === 'function') {
                response.status(status).send(errorResponse);
            } else if (raw && typeof raw.setHeader === 'function') {
                raw.statusCode = status;
                raw.setHeader('Content-Type', 'application/json');
                raw.end(JSON.stringify(errorResponse));
            } else {
                this.logger.error('CRITICAL: Response object is unusable for status/send');
                if (raw && typeof raw.end === 'function') raw.end(JSON.stringify(errorResponse));
            }
        } catch (err: any) {
            this.logger.error(`Failed to dispatch error response: ${err.message}`);
            // Fallback to raw Node response if possible
            try {
                const raw = response.raw || response;
                if (raw && !raw.writableEnded) {
                    raw.statusCode = status;
                    raw.end(JSON.stringify({ statusCode: status, message: 'Internal Server Error (Emergency Fallback)' }));
                }
            } catch (e) { }
        }
    }
}
