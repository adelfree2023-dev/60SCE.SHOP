import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    /**
     * Get wallet balance and transaction history
     * [SEC] S2: Uses tenant-scoped DB client
     */
    async getBalanceWithHistory(request: any, userId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        // Get transactions
        const transactionsResult = await client.query(
            `SELECT id, type, amount, balance_after, description, reference_type, created_at 
             FROM wallet_transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );

        // Calculate current balance from last transaction or 0
        const balance = transactionsResult.rows.length > 0
            ? parseFloat(transactionsResult.rows[0].balance_after)
            : 0;

        return {
            balance,
            currency: 'USD', // Could be tenant-configurable
            transactions: transactionsResult.rows,
        };
    }

    /**
     * Get just the balance (for quick stats)
     */
    async getBalance(request: any, userId: string): Promise<number> {
        const data = await this.getBalanceWithHistory(request, userId);
        return data.balance;
    }

    /**
     * Credit wallet (Admin action)
     * [SEC] S4: Logged in audit trail automatically
     */
    async credit(request: any, userId: string, amount: number, description: string, adminId?: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        if (amount <= 0) throw new ForbiddenException('Amount must be positive');

        // Get current balance
        const currentBalance = await this.getBalance(request, userId);
        const newBalance = currentBalance + amount;

        // Insert transaction
        await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_type, created_by)
             VALUES ($1, 'credit', $2, $3, $4, 'gift', $5)`,
            [userId, amount, newBalance, description, adminId]
        );

        this.logger.log(`💰 Credited ${amount} to user ${userId}, new balance: ${newBalance}`);

        // [SEC] S4: Audit Trail
        await this.logAudit(request, 'WALLET_CREDIT', userId, { amount, description, adminId });

        return { success: true, newBalance };
    }

    /**
     * Debit wallet (used during checkout)
     */
    async debit(request: any, userId: string, amount: number, orderId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const currentBalance = await this.getBalance(request, userId);
        if (currentBalance < amount) {
            throw new ForbiddenException('Insufficient wallet balance');
        }

        const newBalance = currentBalance - amount;

        await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
             VALUES ($1, 'debit', $2, $3, 'Order payment', $4, 'order')`,
            [userId, amount, newBalance, orderId]
        );

        // [SEC] S4: Audit Trail
        await this.logAudit(request, 'WALLET_DEBIT', userId, { amount, orderId });

        return { success: true, newBalance };
    }

    /**
     * Refund to wallet
     */
    async refund(request: any, userId: string, amount: number, orderId: string, reason: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const currentBalance = await this.getBalance(request, userId);
        const newBalance = currentBalance + amount;

        await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
             VALUES ($1, 'refund', $2, $3, $4, $5, 'refund')`,
            [userId, amount, newBalance, reason, orderId]
        );

        // [SEC] S4: Audit Trail
        await this.logAudit(request, 'WALLET_REFUND', userId, { amount, orderId, reason });

        this.logger.log(`🔄 Refunded ${amount} to user ${userId} for order ${orderId}`);
        return { success: true, newBalance };
    }

    private async logAudit(request: any, action: string, targetId: string, metadata: any) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) return;

        const actorId = request.user?.id || 'system';
        const tenantId = request.tenantId || 'unknown';

        try {
            await client.query(
                'INSERT INTO public.audit_logs (action, actor_id, target_id, metadata, tenant_id) VALUES ($1, $2, $3, $4, $5)',
                [action, actorId, targetId, JSON.stringify(metadata), tenantId]
            );
        } catch (e: any) {
            this.logger.error(`Failed to write audit log: ${e.message}`);
        }
    }
}
