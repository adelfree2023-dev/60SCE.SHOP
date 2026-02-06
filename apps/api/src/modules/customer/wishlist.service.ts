import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';

@Injectable()
export class WishlistService {
    private readonly logger = new Logger(WishlistService.name);

    /**
     * Get all wishlist items for user with product details
     * [SEC] S2: Uses tenant-scoped DB client
     */
    async findByUser(request: any, userId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await client.query(
            `SELECT w.id, w.product_id, w.notify_on_sale, w.price_at_add, w.created_at,
                    p.name, p.price, p.image_url, p.stock
             FROM wishlist w
             JOIN products p ON p.id = w.product_id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [userId]
        );

        // Check for price drops
        return result.rows.map((item: any) => ({
            ...item,
            hasPriceDrop: item.price_at_add && parseFloat(item.price) < parseFloat(item.price_at_add),
            priceDifference: item.price_at_add
                ? (parseFloat(item.price_at_add) - parseFloat(item.price)).toFixed(2)
                : null,
        }));
    }

    /**
     * Count wishlist items (for quick stats)
     */
    async count(request: any, userId: string): Promise<number> {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) return 0;

        try {
            const result = await client.query(
                `SELECT COUNT(*) as count FROM wishlist WHERE user_id = $1`,
                [userId]
            );
            return parseInt(result.rows[0].count, 10);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Add product to wishlist
     */
    async add(request: any, userId: string, productId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        // Get current product price
        const productResult = await client.query(
            `SELECT price FROM products WHERE id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            throw new NotFoundException('Product not found');
        }

        const currentPrice = productResult.rows[0].price;

        try {
            await client.query(
                `INSERT INTO wishlist (user_id, product_id, price_at_add)
                 VALUES ($1, $2, $3)`,
                [userId, productId, currentPrice]
            );
            this.logger.log(`❤️ Product ${productId} added to wishlist for user ${userId}`);

            // [SEC] S4: Audit Trail
            await this.logAudit(request, 'WISHLIST_ADD', productId, { userId });

            return { success: true };
        } catch (error: any) {
            if (error.code === '23505') { // Unique violation
                throw new ConflictException('Product already in wishlist');
            }
            throw error;
        }
    }

    /**
     * Remove product from wishlist
     */
    async remove(request: any, userId: string, productId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await client.query(
            `DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id`,
            [userId, productId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException('Product not in wishlist');
        }

        // [SEC] S4: Audit Trail
        await this.logAudit(request, 'WISHLIST_REMOVE', productId, { userId });

        return { success: true };
    }

    /**
     * Toggle notify on sale preference
     */
    async toggleNotify(request: any, userId: string, productId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await client.query(
            `UPDATE wishlist SET notify_on_sale = NOT notify_on_sale 
             WHERE user_id = $1 AND product_id = $2 
             RETURNING notify_on_sale`,
            [userId, productId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException('Product not in wishlist');
        }

        return { notifyOnSale: result.rows[0].notify_on_sale };
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
