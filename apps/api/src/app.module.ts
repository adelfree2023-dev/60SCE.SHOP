import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuditLoggerInterceptor } from '@apex/audit';
import { RateLimiterMiddleware, HelmetMiddleware, RequestIdMiddleware, TenantScopeGuard, GlobalExceptionFilter } from '@apex/security';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { RedisModule } from '@apex/redis';
import { CacheModule } from '@apex/cache';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './common/controllers/health.controller';
import { ConfigModule } from '@nestjs/config';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { BlueprintsModule } from './modules/blueprints/blueprints.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 1000, // [SEC] S6: Raised to 1000 to allow full security test suite runs
        }]),
        EventEmitterModule.forRoot(),
        RedisModule,
        CacheModule,
        ProvisioningModule,
        StorefrontModule,
        TenantsModule,
        IdentityModule,
        AuthModule,
        CustomerModule,
        AdminModule,
        SuperAdminModule,
        BlueprintsModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditLoggerInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: TenantScopeGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestIdMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });

        consumer
            .apply(HelmetMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });

        consumer
            .apply(TenantMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });

        consumer
            .apply(RateLimiterMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}

