import { Injectable, NestMiddleware } from '@nestjs/common';
import helmet from 'helmet';

@Injectable()
export class HelmetMiddleware implements NestMiddleware {
    private readonly helmetHandler = helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://*.60sec.shop"],
                connectSrc: ["'self'", "https://*.60sec.shop", "https://api.60sec.shop"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        noSniff: true,
        xssFilter: true,
        hidePoweredBy: true,
        frameguard: { action: 'deny' },
    });

    use(req: any, res: any, next: () => void) {
        this.helmetHandler(req, res, next);
    }
}

