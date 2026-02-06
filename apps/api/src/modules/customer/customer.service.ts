import { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AddressService } from './address.service';
import { WalletService } from './wallet.service';
import { WishlistService } from './wishlist.service';

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly addressService: AddressService,
        private readonly walletService: WalletService,
        private readonly wishlistService: WishlistService,
    ) { }

    /**
     * Get aggregated customer profile
     * [SEC] S2: Combines Global Schema (identity) + Tenant Schema (addresses, orders) data
     */
    async getAggregatedProfile(request: any) {
        const userId = request.user.id;
        const tenantId = request.tenantId || request.raw?.tenantId;

        this.logger.log(`📊 Aggregating profile for user ${userId} in tenant ${tenantId}`);

        // 1. Fetch global user data (from public.users - using global pool)
        const userResult = await this.pool.query(
            `SELECT id, email, role, created_at FROM public.users WHERE id = $1`,
            [userId]
        );
        const user = userResult.rows[0];

        if (!user) {
            throw new Error('User not found');
        }

        // 2. Fetch tenant-specific data in parallel (using request.dbClient with search_path)
        const [addresses, walletData, wishlistCount, recentOrders] = await Promise.all([
            this.addressService.findByUser(request, userId),
            this.walletService.getBalanceWithHistory(request, userId),
            this.wishlistService.count(request, userId),
            this.getRecentOrders(request, userId),
        ]);

        return {
            // Global identity
            id: user.id,
            email: user.email,
            role: user.role,
            memberSince: user.created_at,

            // Tenant-specific data
            addresses,
            wallet: walletData,

            // Quick stats for dashboard
            stats: {
                activeOrders: recentOrders.filter((o: any) => o.status !== 'delivered').length,
                wishlistItems: wishlistCount,
                totalOrders: recentOrders.length,
            },

            // Recent orders for quick access
            recentOrders: recentOrders.slice(0, 5),
        };
    }

    /**
     * Get recent orders for user (tenant-scoped)
     */
    private async getRecentOrders(request: any, userId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) {
            this.logger.warn('No tenant DB client available, skipping orders');
            return [];
        }

        try {
            const result = await client.query(
                `SELECT id, status, total, created_at, tracking_number 
                 FROM orders 
                 WHERE customer_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 10`,
                [userId]
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`Could not fetch orders: ${error.message}`);
            return [];
        }
    }
}
