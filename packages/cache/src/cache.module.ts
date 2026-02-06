import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
    providers: [
        {
            provide: 'CACHE_SERVICE',
            useClass: CacheService,
        },
        CacheService,
    ],
    exports: ['CACHE_SERVICE', CacheService],
})
export class CacheModule { }
