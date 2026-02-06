import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { RedisService } from '@apex/redis';
import { SkipTenantValidation } from '../decorators/skip-tenant-validation.decorator';

@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly redisService: RedisService
    ) { }

    @Get()
    @SkipTenantValidation()
    async check() {
        const results: any = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            dependencies: {}
        };

        try {
            // Check Database
            await this.pool.query('SELECT 1');
            results.dependencies.database = 'healthy';
        } catch (error: any) {
            this.logger.error(`❌ Health Check Failed (Database): ${error.message}`);
            results.status = 'error';
            results.dependencies.database = 'unhealthy';
        }

        try {
            // Check Redis
            await this.redisService.ping();
            results.dependencies.cache = 'healthy';
        } catch (error: any) {
            this.logger.error(`❌ Health Check Failed (Redis): ${error.message}`);
            results.status = 'error';
            results.dependencies.cache = 'unhealthy';
        }

        return results;
    }
}
