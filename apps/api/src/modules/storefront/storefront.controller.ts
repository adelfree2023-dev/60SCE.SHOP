import { Controller, Get, Param, UseInterceptors, Logger, HttpCode, Inject, Req, Patch, Put, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { StorefrontService } from './storefront.service';
import { TenantScopeGuard, SkipTenantScope } from '@apex/security';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateBrandingSchema, UpdateBrandingDto } from './schemas/branding.schema';
import { UpdateHeroSchema, UpdateHeroDto } from './schemas/hero.schema';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
    private readonly logger = new Logger(StorefrontController.name);

    constructor(
        @Inject('STOREFRONT_SERVICE')
        private readonly storefrontService: StorefrontService
    ) {
        this.logger.log('StorefrontController initialized');
    }

    @SkipTenantScope()
    @Get('home')
    @ApiOperation({
        summary: 'Get home page data (Store-#01)',
        description: 'Returns tenant-specific home page with banners, best sellers, categories, promotions, and testimonials'
    })
    @ApiResponse({ status: 200, description: 'Home page data retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Tenant not found' })
    @HttpCode(200)
    async getHomePage(@Req() request: any) {
        this.logger.log(`GET /storefront/home - Tenant: ${request.tenantId || 'null'}`);
        return this.storefrontService.getHomePage(request);
    }

    @SkipTenantScope()
    @Get('products')
    @ApiOperation({
        summary: 'Get all products (Store-#02)',
        description: 'Returns tenant-specific products with pagination and optional filters'
    })
    @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    @HttpCode(200)
    async getProducts(@Req() request: any) {
        this.logger.log(`GET /storefront/products - Tenant: ${request.tenantId || 'null'}`);
        return this.storefrontService.getProducts(request);
    }

    @SkipTenantScope()
    @Get('products/:id')
    @ApiOperation({
        summary: 'Get single product (Store-#03)',
        description: 'Returns a single product by ID'
    })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @HttpCode(200)
    async getProduct(@Req() request: any, @Param('id') id: string) {
        this.logger.log(`GET /storefront/products/${id} - Tenant: ${request.tenantId || 'null'}`);
        return this.storefrontService.getProductById(request, id);
    } @SkipTenantScope()
    @Get('settings')
    @ApiOperation({
        summary: 'Get tenant settings (Load Test Target)',
        description: 'Returns all settings for the current tenant directly from DB'
    })
    @ApiResponse({ status: 200, description: 'Settings retrieved' })
    @HttpCode(200)
    async getSettings(@Req() request: any) {
        return this.storefrontService.getSettings(request);
    }

    @Patch('branding')
    @UseGuards(TenantScopeGuard)
    @UsePipes(new ZodValidationPipe(UpdateBrandingSchema))
    @ApiOperation({
        summary: 'Update store branding (Protected)',
        description: 'Updates tenant name, logo, and primary color. Requires tenant ownership.'
    })
    @ApiResponse({ status: 200, description: 'Branding updated successfully' })
    @ApiResponse({ status: 403, description: 'Access Denied: Cross-tenant operation or unauthenticated' })
    @ApiBody({ type: Object, description: 'Branding update fields' })
    @HttpCode(200)
    async updateBranding(@Req() request: any, @Body() dto: UpdateBrandingDto) {
        this.logger.log(`PATCH /storefront/branding - Tenant: ${request.tenantId}`);
        return this.storefrontService.updateBranding(request, dto);
    }

    @Put('hero')
    @UseGuards(TenantScopeGuard)
    @UsePipes(new ZodValidationPipe(UpdateHeroSchema))
    @ApiOperation({
        summary: 'Update hero banners (Protected)',
        description: 'Updates or creates the primary hero banner. Requires tenant ownership.'
    })
    @ApiResponse({ status: 200, description: 'Hero banner updated successfully' })
    @ApiResponse({ status: 403, description: 'Access Denied: Cross-tenant operation' })
    @ApiBody({ type: Object, description: 'Hero banner content' })
    @HttpCode(200)
    async updateHero(@Req() request: any, @Body() dto: UpdateHeroDto) {
        this.logger.log(`PUT /storefront/hero - Tenant: ${request.tenantId}`);
        return this.storefrontService.updateHero(request, dto);
    }

    @SkipTenantScope()
    @Get('home/refresh')
    @ApiOperation({
        summary: 'Refresh home page cache',
        description: 'Invalidates and regenerates cache for tenant home page'
    })
    @ApiResponse({ status: 200, description: 'Cache refreshed successfully' })
    @HttpCode(200)
    async refreshHomePage(@Req() request: any) {
        this.logger.log('Refreshing cache for current tenant');
        await this.storefrontService.invalidateCache(request);
        await this.storefrontService.warmCache(request);
        return {
            success: true,
            message: 'Cache refreshed for current tenant',
            timestamp: new Date().toISOString()
        };
    }
}
