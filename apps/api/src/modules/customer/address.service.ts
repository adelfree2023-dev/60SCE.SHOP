import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '@apex/encryption';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
    private readonly logger = new Logger(AddressService.name);

    constructor(private readonly encryptionService: EncryptionService) { }

    /**
     * Find all addresses for a user (tenant-scoped)
     * [SEC] S7: Decrypts PII fields before returning
     */
    async findByUser(request: any, userId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await client.query(
            `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
            [userId]
        );

        // Decrypt PII fields
        return Promise.all(result.rows.map(async (addr: any) => ({
            ...addr,
            phone: await this.encryptionService.decryptDbValue(addr.phone),
            street: await this.encryptionService.decryptDbValue(addr.street),
        })));
    }

    /**
     * Create new address
     * [SEC] S7: Encrypts PII fields before storage
     */
    async create(request: any, userId: string, dto: CreateAddressDto) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        // Encrypt PII
        const encryptedPhone = await this.encryptionService.encryptDbValue(dto.phone);
        const encryptedStreet = await this.encryptionService.encryptDbValue(dto.street);

        // If setting as default, clear other defaults first
        if (dto.isDefault) {
            await client.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
        }

        const result = await client.query(
            `INSERT INTO addresses (user_id, label, recipient_name, phone, street, building, floor, apartment, landmark, city, postal_code, latitude, longitude, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING id`,
            [userId, dto.label, dto.recipientName, encryptedPhone, encryptedStreet, dto.building, dto.floor, dto.apartment, dto.landmark, dto.city, dto.postalCode, dto.latitude, dto.longitude, dto.isDefault || false]
        );

        this.logger.log(`📍 Address created for user ${userId}: ${result.rows[0].id}`);
        return { id: result.rows[0].id, success: true };
    }

    /**
     * Update address
     * [SEC] S2: Enforces user ownership
     */
    async update(request: any, userId: string, addressId: string, dto: UpdateAddressDto) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        // Verify ownership
        const existing = await client.query(`SELECT id FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, userId]);
        if (existing.rows.length === 0) {
            throw new ForbiddenException('Address not found or not owned by user');
        }

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (dto.label) { fields.push(`label = $${idx++}`); values.push(dto.label); }
        if (dto.recipientName) { fields.push(`recipient_name = $${idx++}`); values.push(dto.recipientName); }
        if (dto.phone) { fields.push(`phone = $${idx++}`); values.push(await this.encryptionService.encryptDbValue(dto.phone)); }
        if (dto.street) { fields.push(`street = $${idx++}`); values.push(await this.encryptionService.encryptDbValue(dto.street)); }
        if (dto.building !== undefined) { fields.push(`building = $${idx++}`); values.push(dto.building); }
        if (dto.floor !== undefined) { fields.push(`floor = $${idx++}`); values.push(dto.floor); }
        if (dto.apartment !== undefined) { fields.push(`apartment = $${idx++}`); values.push(dto.apartment); }
        if (dto.landmark !== undefined) { fields.push(`landmark = $${idx++}`); values.push(dto.landmark); }
        if (dto.city) { fields.push(`city = $${idx++}`); values.push(dto.city); }
        if (dto.postalCode !== undefined) { fields.push(`postal_code = $${idx++}`); values.push(dto.postalCode); }
        if (dto.latitude !== undefined) { fields.push(`latitude = $${idx++}`); values.push(dto.latitude); }
        if (dto.longitude !== undefined) { fields.push(`longitude = $${idx++}`); values.push(dto.longitude); }

        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) return { success: true }; // Only updated_at, no real changes

        values.push(addressId);
        await client.query(`UPDATE addresses SET ${fields.join(', ')} WHERE id = $${idx}`, values);

        return { success: true };
    }

    /**
     * Delete address
     */
    async delete(request: any, userId: string, addressId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await client.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id`, [addressId, userId]);
        if (result.rows.length === 0) {
            throw new ForbiddenException('Address not found or not owned by user');
        }

        return { success: true };
    }

    /**
     * Set address as default
     */
    async setDefault(request: any, userId: string, addressId: string) {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) throw new Error('TENANT_CONTEXT_MISSING');

        // Verify ownership
        const existing = await client.query(`SELECT id FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, userId]);
        if (existing.rows.length === 0) {
            throw new ForbiddenException('Address not found or not owned by user');
        }

        // Clear all defaults, then set this one
        await client.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
        await client.query(`UPDATE addresses SET is_default = true WHERE id = $1`, [addressId]);

        return { success: true };
    }
}
