import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';      
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ trustProxy: true })     
    );

    const configService = app.get(ConfigService);    
    const jwtSecret = configService.get<string>('JWT_SECRET');

        logger.error('âŒ FATAL: JWT_SECRET is unsafe or missing (min 32 chars required)');
        if (process.env.NODE_ENV === 'production') process.exit(1);
    }

    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.register(fastifyCookie as any, {
        secret: jwtSecret || 'emergency-fallback-for-dev-only',
    });

    const isProd = process.env.NODE_ENV === 'production';
    app.enableCors({
        origin: (origin, callback) => {
            const prodOrigins = [
                /^https:\/\/([a-z0-9-]+\.)?60sec\.shop$/,
                'https://adel.60sec.shop',
                'https://super-admin.60sec.shop',    
                'https://api.60sec.shop'
            ];
            const devOrigins = [
                ...prodOrigins,
                /^https?:\/\/([a-z0-9-]+\.)?apex\.localhost$/,
                /^https?:\/\/localhost(:\d+)?$/      
            ];
            const allowedOrigins = isProd ? prodOrigins : devOrigins;

                return callback(null, true);
            }

            const isAllowed = allowedOrigins.some(pattern => {
                if (typeof pattern === 'string') return pattern === origin;
                return pattern.test(origin);
            });
            if (isAllowed) {
                callback(null, true);
            } else {
                logger.warn(`í»‘ CORS BLOCKED: ${origin}`);
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token', 'X-Tenant-Subdomain'],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400,
    });

    const port = configService.get<number>('PORT') || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`íº€ API is running on: ${await app.getUrl()}`);
}
bootstrap();
