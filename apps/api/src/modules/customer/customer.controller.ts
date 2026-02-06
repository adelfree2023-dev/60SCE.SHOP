import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Logger, UseInterceptors } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AddressService } from './address.service';
import { WalletService } from './wallet.service';
import { WishlistService } from './wishlist.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { ChangePasswordSchema, ChangePasswordDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IdentityService } from '../identity/identity.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsePipes } from '@nestjs/common';
import { AuditLoggerInterceptor } from '../../common/interceptors/audit-logger.interceptor';
import { Throttle } from '@nestjs/throttler';

@Controller('customer')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditLoggerInterceptor)
export class CustomerController {
    private readonly logger = new Logger(CustomerController.name);

    constructor(
        private readonly customerService: CustomerService,
        private readonly addressService: AddressService,
        private readonly walletService: WalletService,
        private readonly wishlistService: WishlistService,
        private readonly identityService: IdentityService,
    ) { }

    @Post('change-password')
    @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async changePassword(@Req() request: any, @Body() dto: ChangePasswordDto) {
        return this.identityService.changePassword(request.user.id, dto.currentPassword, dto.newPassword);
    }

    /**
     * GET /api/customer/me
     * The "Get-Me" Aggregator - Returns all customer data in one request
     * [SEC] S2: Fetches global data (name/email) + tenant-specific data (addresses/orders)
     */
    @Get('me')
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    async getMyProfile(@Req() request: any) {
        this.logger.log(`📋 Fetching profile for user: ${request.user.id}`);
        return this.customerService.getAggregatedProfile(request);
    }

    // ═══════════════════════════════════════════════════════════
    // ADDRESS MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    @Get('addresses')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async getAddresses(@Req() request: any) {
        return this.addressService.findByUser(request, request.user.id);
    }

    @Post('addresses')
    async createAddress(@Req() request: any, @Body() dto: CreateAddressDto) {
        return this.addressService.create(request, request.user.id, dto);
    }

    @Put('addresses/:id')
    async updateAddress(@Req() request: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
        return this.addressService.update(request, request.user.id, id, dto);
    }

    @Delete('addresses/:id')
    async deleteAddress(@Req() request: any, @Param('id') id: string) {
        return this.addressService.delete(request, request.user.id, id);
    }

    @Post('addresses/:id/default')
    async setDefaultAddress(@Req() request: any, @Param('id') id: string) {
        return this.addressService.setDefault(request, request.user.id, id);
    }

    // ═══════════════════════════════════════════════════════════
    // WALLET
    // ═══════════════════════════════════════════════════════════

    @Get('wallet')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async getWallet(@Req() request: any) {
        return this.walletService.getBalanceWithHistory(request, request.user.id);
    }

    // ═══════════════════════════════════════════════════════════
    // WISHLIST
    // ═══════════════════════════════════════════════════════════

    @Get('wishlist')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async getWishlist(@Req() request: any) {
        return this.wishlistService.findByUser(request, request.user.id);
    }

    @Post('wishlist/:productId')
    async addToWishlist(@Req() request: any, @Param('productId') productId: string) {
        return this.wishlistService.add(request, request.user.id, productId);
    }

    @Delete('wishlist/:productId')
    async removeFromWishlist(@Req() request: any, @Param('productId') productId: string) {
        return this.wishlistService.remove(request, request.user.id, productId);
    }

    // ═══════════════════════════════════════════════════════════
    // SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    @Get('sessions')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async getSessions(@Req() request: any) {
        return this.identityService.getUserSessions(request.user.id);
    }

    @Post('revoke-sessions')
    async revokeSessions(@Req() request: any, @Body('currentSessionId') currentSessionId: string) {
        return this.identityService.revokeOtherSessions(request.user.id, currentSessionId);
    }
}
