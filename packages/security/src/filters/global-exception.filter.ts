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

        const logPayload = {
            requestId,
            tenant,
            timestamp: new Date().toISOString(),
            path,
            method: (request as any).method || 'UNKNOWN',
            status,
            exception: exception instanceof Error ? exception.stack : exception,
        };

        if (status >= 500) {
            this.logger.error(`🚨 Fatal Error [${requestId}]: ${JSON.stringify(logPayload)}`);
        } else {
            this.logger.warn(`⚠️ Warning [${requestId}]: ${JSON.stringify(logPayload)}`);
        }

        // 2. [FIX-013] PRODUCTION ERROR MASKING
        const isProduction = process.env.NODE_ENV === 'production';
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path,
            message: (isProduction && status >= 500)
                ? 'An unexpected error occurred. Please contact support.'
                : typeof message === 'string' ? message : (message as any).message || message,
        };

        // 3. FASTIFY / NATIVE COMPATIBILITY
        try {
            if (typeof response.status === 'function' && typeof response.send === 'function') {
                // Fastified Response (Standard for our NestJS setup)
                response.status(status).send(errorResponse);
            } else if (typeof response.code === 'function' && typeof response.send === 'function') {
                // Alternative Fastify signature
                response.code(status).send(errorResponse);
            } else {
                // Raw Proxy/Stream Response (Fallback)
                const res = response as any;
                res.statusCode = status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(errorResponse));
            }
        } catch (err: any) {
            this.logger.error(`Failed to dispatch error response: ${err.message}`);
        }
    }
}
