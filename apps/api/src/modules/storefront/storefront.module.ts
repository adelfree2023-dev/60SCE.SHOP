import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { CacheService, CacheModule } from '@apex/cache';

@Module({
    imports: [CacheModule],
    controllers: [StorefrontController],
    providers: [
        {
            provide: 'STOREFRONT_SERVICE',
            useClass: StorefrontService,
        },
        StorefrontService,
    ],
    exports: ['STOREFRONT_SERVICE', StorefrontService],
})
export class StorefrontModule { }
