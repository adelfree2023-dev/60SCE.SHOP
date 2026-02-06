import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateBlueprintDto, UpdateBlueprintDto } from './dto';

@Injectable()
export class BlueprintsService {
    private readonly logger = new Logger(BlueprintsService.name);
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }

    async findAll() {
        const result = await this.pool.query(
            `SELECT id, name, is_default, created_at 
       FROM public.onboarding_blueprints 
       ORDER BY is_default DESC, created_at DESC`
        );
        return result.rows;
    }

    async findOne(id: string) {
        const result = await this.pool.query(
            `SELECT * FROM public.onboarding_blueprints WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException(`Blueprint "${id}" not found`);
        }

        return result.rows[0];
    }

    async create(createDto: CreateBlueprintDto) {
        // Ensure only one default blueprint exists
        if (createDto.is_default) {
            await this.pool.query(
                `UPDATE public.onboarding_blueprints SET is_default = false`
            );
        }

        const result = await this.pool.query(
            `INSERT INTO public.onboarding_blueprints (name, config, is_default)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [createDto.name, createDto.config, createDto.is_default]
        );

        this.logger.log(`Blueprint created: ${createDto.name}`);
        return result.rows[0];
    }

    async update(id: string, updateDto: UpdateBlueprintDto) {
        const current = await this.findOne(id);

        // Handle default toggle
        if (updateDto.is_default && !current.is_default) {
            await this.pool.query(
                `UPDATE public.onboarding_blueprints SET is_default = false`
            );
        }

        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updateDto.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(updateDto.name);
        }
        if (updateDto.config !== undefined) {
            fields.push(`config = $${paramIndex++}`);
            values.push(updateDto.config);
        }
        if (updateDto.is_default !== undefined) {
            fields.push(`is_default = $${paramIndex++}`);
            values.push(updateDto.is_default);
        }

        if (fields.length === 0) {
            return current;
        }

        values.push(id);

        const result = await this.pool.query(
            `UPDATE public.onboarding_blueprints 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
            values
        );

        this.logger.log(`Blueprint updated: ${id}`);
        return result.rows[0];
    }

    async remove(id: string) {
        const blueprint = await this.findOne(id);
        if (blueprint.is_default) {
            throw new BadRequestException('Cannot delete default blueprint');
        }

        const result = await this.pool.query(
            `DELETE FROM public.onboarding_blueprints WHERE id = $1 RETURNING *`,
            [id]
        );

        this.logger.log(`Blueprint deleted: ${id}`);
        return { success: true, id };
    }
}
