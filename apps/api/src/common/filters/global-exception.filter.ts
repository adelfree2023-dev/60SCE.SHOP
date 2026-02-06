import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<FastifyRequest>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal Server Error';

        // 1. LOG THE ERROR (Forensic Audit Trail)
        const requestId = request.headers['x-request-id'] || 'no-id';
        const logData = {
            requestId,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            status,
            exception: exception instanceof Error ? exception.stack : exception,
        };

        if (status >= 500) {
            this.logger.error(`🚨 Fatal Error [${requestId}]: ${JSON.stringify(logData)}`);
        } else {
            this.logger.warn(`⚠️ Exception [${requestId}]: ${JSON.stringify(logData)}`);
        }

        // 2. MASK INTERNAL ERRORS (Fortress Protocol FIX-013)
        const isProduction = process.env.NODE_ENV === 'production';
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: (isProduction && status >= 500)
                ? 'An unexpected error occurred. Please contact support.'
                : typeof message === 'string' ? message : (message as any).message || message,
        };

        response.status(status).send(errorResponse);
    }
}
