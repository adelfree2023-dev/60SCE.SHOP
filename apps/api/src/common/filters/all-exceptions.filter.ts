import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message:
                exception instanceof HttpException
                    ? exception.message
                    : 'Internal Server Error',
        };

        // [SEC] S5: No stack traces in production
        if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`Critical Error: ${JSON.stringify(exception)}`);
        } else {
            this.logger.warn(`Operational Error: ${JSON.stringify(responseBody)}`);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
