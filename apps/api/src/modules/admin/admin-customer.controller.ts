import { Controller, Get, Post, Body, Param, Req, UseGuards, Logger, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletService } from '../customer/wallet.service';
import { RolesGuard, Roles } from '@apex/security';

/**
 * Admin Customer Controller
 * [SEC] S4: Admin-only endpoints for customer management
 * [SEC] S2: Merchants can only see customers within their own tenant
 */
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant', 'super-admin', 'admin')
export class AdminCustomerController {
    private readonly logger = new Logger(AdminCustomerController.name);

    constructor(
        private readonly walletService: WalletService,
    ) { }

    /**
     * GET /api/admin/customers
     * List all customers in tenant (with basic info only - no PII)
     */
    @Get()
    async listCustomers(@Req() request: any, @Query('search') search?: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new ForbiddenException('TENANT_CONTEXT_MISSING');

        let query = `
            SELECT 
                u.id,
                u.email,
                u.created_at,
                (SELECT COUNT(*) FROM orders WHERE customer_id = u.id) as order_count,
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = u.id) as total_spent
            FROM public.users u
            WHERE u.id IN (SELECT DISTINCT customer_id FROM orders)
        `;

        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND u.email ILIKE $${params.length}`;
        }

        query += ` ORDER BY u.created_at DESC LIMIT 100`;

        const result = await client.query(query, params);

        return result.rows.map((row: any) => ({
            id: row.id,
            email: row.email, // Email is not considered full PII for merchants
            memberSince: row.created_at,
            stats: {
                orderCount: parseInt(row.order_count, 10),
                totalSpent: parseFloat(row.total_spent),
            }
        }));
    }

    /**
     * GET /api/admin/customers/:id
     * Get customer details (limited - no sensitive PII)
     */
    @Get(':id')
    async getCustomer(@Req() request: any, @Param('id') customerId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new ForbiddenException('TENANT_CONTEXT_MISSING');

        // Basic customer info (NO full address, NO payment tokens)
        const userResult = await client.query(
            `SELECT id, email, created_at FROM public.users WHERE id = $1`,
            [customerId]
        );

        if (userResult.rows.length === 0) {
            throw new ForbiddenException('Customer not found');
        }

        const user = userResult.rows[0];

        // Get wallet balance
        const walletData = await this.walletService.getBalanceWithHistory(request, customerId);

        // Get order stats
        const orderResult = await client.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM orders WHERE customer_id = $1`,
            [customerId]
        );

        return {
            id: user.id,
            email: user.email,
            memberSince: user.created_at,
            wallet: {
                balance: walletData.balance,
                // Admin can see transaction history for audit
                recentTransactions: walletData.transactions.slice(0, 10),
            },
            stats: {
                orderCount: parseInt(orderResult.rows[0].count, 10),
                totalSpent: parseFloat(orderResult.rows[0].total),
            }
        };
    }

    /**
     * POST /api/admin/customers/:id/wallet/credit
     * Add credit to customer wallet (for compensation, gifts, etc.)
     * [SEC] S4: Action is logged in audit trail
     */
    @Post(':id/wallet/credit')
    async addWalletCredit(
        @Req() request: any,
        @Param('id') customerId: string,
        @Body() dto: { amount: number; reason: string }
    ) {
        this.logger.log(`💰 Admin ${request.user.id} crediting ${dto.amount} to customer ${customerId}`);

        // Validate amount
        if (!dto.amount || dto.amount <= 0 || dto.amount > 1000) {
            throw new ForbiddenException('Amount must be between $0.01 and $1000');
        }

        if (!dto.reason || dto.reason.length < 3) {
            throw new ForbiddenException('Reason is required');
        }

        const result = await this.walletService.credit(
            request,
            customerId,
            dto.amount,
            dto.reason,
            request.user.id // Admin ID for audit
        );

        return {
            success: true,
            newBalance: result.newBalance,
            message: `Successfully credited $${dto.amount.toFixed(2)} to customer wallet`
        };
    }
}
