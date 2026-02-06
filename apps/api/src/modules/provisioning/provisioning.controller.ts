import { Controller, Post, Body, Headers, UnauthorizedException, Logger, Req } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SkipTenantScope } from '@apex/security';

@Controller('provisioning')
export class ProvisioningController {
    private readonly logger = new Logger(ProvisioningController.name);

    constructor(
        private readonly provisioningService: ProvisioningService,
        private readonly configService: ConfigService
    ) { }

    @Post('webhook')
    async handleStripeWebhook(
        @Body() payload: any,
        @Headers('stripe-signature') signature: string
    ) {
        // CRITICAL-009: Stripe Webhook Signature Verification
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!signature || !webhookSecret) {
            this.logger.warn('🛑 Missing stripe-signature or webhook secret');
            throw new UnauthorizedException('Invalid signature');
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // [SEC] S8/S3: Protection against timing attacks using constant-time comparison
        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
            this.logger.warn(`🛑 Invalid Stripe signature attempt (potential timing attack): ${signature}`);
            throw new UnauthorizedException('Invalid signature');
        }

        this.logger.log(`✅ Stripe webhook verified for event: ${payload.type}`);
        return this.provisioningService.handleWebhookEvent(payload);
    }

    @SkipTenantScope()
    @Post('manual')
    async manualProvision(@Body() data: CreateTenantDto) {
        this.logger.log(`🚀 Manual provisioning triggered for: ${data.subdomain}`);
        return this.provisioningService.provisionTenant(data);
    }

    @SkipTenantScope()
    @Post('tenants')
    async createTenant(@Body() data: CreateTenantDto) {
        this.logger.log(`🚀 Storefront registration triggered for: ${data.subdomain}`);
        return this.provisioningService.provisionTenant(data);
    }
}
