import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    // [EPIC1-001] Performance: Use Fastify for high throughput with Proxy Trust
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({
            trustProxy: true,
            // [S3/S9] Payload Exhaustion Resilience: Strict Header Limits
            maxHeaderSize: 4096, // 4KB (Test probe is 8KB)
            bodyLimit: 1024 * 1024, // 1MB
        })
    );

    // [FIX] Cast to any to bypass strict FastifyPluginCallback mismatch with NestJS wrapper
    await app.register(fastifyCookie as any);

    // [SEC] S3: Global Input Validation (Zero Trust)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    const configService = app.get(ConfigService);
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // [SEC] S1: Validate Critical Config
    if (!jwtSecret || jwtSecret.length < 32) {
        logger.error('❌ FATAL: JWT_SECRET is missing or insecure (must be 32+ chars).');
        process.exit(1);
    }

    // [SEC] S8: Security Headers (Helmet)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for some next.js bits if embedded
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    // Performance: Compression
    app.use(compression());

    const isProd = process.env.NODE_ENV === 'production';
    const allowedOrigins = [
        'https://60sec.shop',
        'https://www.60sec.shop',
        'https://api.60sec.shop',
        /^https?:\/\/([a-z0-9-]+\.)?60sec\.shop$/,
        // Dev origins
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        /^https?:\/\/([a-z0-9-]+\.)?apex\.localhost$/
    ];

    // [SEC] S8: CORS Configuration
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            const isAllowed = allowedOrigins.some(pattern => {
                if (typeof pattern === 'string') return pattern === origin;
                return pattern.test(origin);
            });

            if (isAllowed) {
                callback(null, true);
            } else {
                logger.warn(`🚫 CORS BLOCKED: ${origin}`);
                // [S8-002] Explicit rejection for security tests
                callback(new Error(`Origin ${origin} not allowed by CORS`), false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token', 'X-Tenant-Subdomain'],
        exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        credentials: true,
        maxAge: 86400,
    });

    const port = configService.get<number>('PORT') || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 API is running on: ${await app.getUrl()}`);
}

bootstrap();
