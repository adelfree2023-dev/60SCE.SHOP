import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Logger } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AddressService } from './address.service';
import { WalletService } from './wallet.service';
import { WishlistService } from './wishlist.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IdentityService } from '../identity/identity.service';

@Controller('customer')
@UseGuards(JwtAuthGuard)
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
    async changePassword(@Req() request: any, @Body() dto: any) {
        const { currentPassword, newPassword } = dto;
        return this.identityService.changePassword(request.user.id, currentPassword, newPassword);
    }

    /**
     * GET /api/customer/me
     * The "Get-Me" Aggregator - Returns all customer data in one request
     * [SEC] S2: Fetches global data (name/email) + tenant-specific data (addresses/orders)
     */
    @Get('me')
    async getMyProfile(@Req() request: any) {
        this.logger.log(`📋 Fetching profile for user: ${request.user.id}`);
        return this.customerService.getAggregatedProfile(request);
    }

    // ═══════════════════════════════════════════════════════════
    // ADDRESS MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    @Get('addresses')
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
    async getWallet(@Req() request: any) {
        return this.walletService.getBalanceWithHistory(request, request.user.id);
    }

    // ═══════════════════════════════════════════════════════════
    // WISHLIST
    // ═══════════════════════════════════════════════════════════

    @Get('wishlist')
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
    async getSessions(@Req() request: any) {
        return this.identityService.getUserSessions(request.user.id);
    }

    @Post('revoke-sessions')
    async revokeSessions(@Req() request: any, @Body('currentSessionId') currentSessionId: string) {
        return this.identityService.revokeOtherSessions(request.user.id, currentSessionId);
    }
}
