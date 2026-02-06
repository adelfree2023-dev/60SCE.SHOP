import { Injectable, Logger, Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import format from 'pg-format';
import { sql } from 'drizzle-orm';

@Injectable()
export class SchemaCreatorService {
  private readonly logger = new Logger(SchemaCreatorService.name);
  private readonly pool: Pool;
  private readonly db: ReturnType<typeof drizzle>;

  constructor(
    @Inject(Pool) pool: Pool,
    @Inject('DATABASE_CONNECTION') db: ReturnType<typeof drizzle>
  ) {
    this.pool = pool;
    this.db = db;
  }

  /**
   * Creates isolated schema for tenant with idempotency check
   * @param tenantId - Unique identifier for the tenant
   * @returns Schema name created
   */
  async createSchema(tenantId: string): Promise<string> {
    const startTime = Date.now();

    // Validation still required as first line of defense
    if (!/^[a-z0-9-]+$/.test(tenantId)) {
      throw new Error('Invalid tenant ID format');
    }

    const schemaName = `tenant_${tenantId}`;

    this.logger.log(`Creating schema: ${schemaName}`);

    try {
      // Idempotency check: Schema already exists
      const exists = await this.schemaExists(schemaName);
      if (exists) {
        this.logger.warn(`Schema ${schemaName} already exists (idempotent)`);
        await this.logAudit('SCHEMA_EXISTS', tenantId, Date.now() - startTime);
        return schemaName;
      }

      // 🔒 SEC-L4 Fix: Use pg-format for parameterized identifiers (Prevents SQL Injection)
      const safeSchemaName = format('%I', schemaName);

      await this.pool.query(format('CREATE SCHEMA IF NOT EXISTS %I', schemaName));

      // Grant privileges using the same safe approach
      await this.pool.query(format('GRANT ALL ON SCHEMA %s TO CURRENT_USER', safeSchemaName));

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Schema created in ${duration}ms: ${schemaName}`);

      await this.logAudit('SCHEMA_CREATED', tenantId, duration);
      return schemaName;
    } catch (error: any) {
      this.logger.error(`Failed to create schema ${schemaName}: ${error.message}`);
      throw new Error(`Schema creation failed: ${error.message}`);
    }
  }

  /**
   * Drops tenant schema (irreversible)
   * @param tenantId - Tenant identifier
   */
  async dropSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;
    this.logger.warn(`🗑️ DROPPING SCHEMA: ${schemaName}`);

    try {
      const safeSchemaName = format('%I', schemaName);
      await this.pool.query(format('DROP SCHEMA IF EXISTS %s CASCADE', safeSchemaName));
      await this.logAudit('SCHEMA_DROPPED', tenantId, 0);
    } catch (error: any) {
      this.logger.error(`Failed to drop schema ${schemaName}: ${error.message}`);
      throw new Error(`Schema deletion failed: ${error.message}`);
    }
  }

  /**
   * Sets search_path for current connection
   * @param tenantId - Tenant identifier
   */
  async setSearchPath(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;
    const safeSchemaName = format('%I', schemaName);

    // 🔒 SEC-L4: Use parameterized query for setting search_path
    // Use %I for identifiers (Schema Name) to ensure correct quoting
    await this.pool.query(format('SET search_path TO %I, public', schemaName));
    this.logger.debug(`Search path set to: ${schemaName}`);
  }

  /**
   * Checks if schema exists
   */
  private async schemaExists(schemaName: string): Promise<boolean> {
    // Also secure this query with parameterized queries
    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    return result.rows.length > 0;
  }

  /**
   * Logs audit entry for schema operations
   */
  private async logAudit(action: string, tenantId: string, duration: number): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO public.audit_logs (user_id, action, tenant_id, duration, status)
         VALUES ($1, $2, $3, $4, $5)`,
        ['system', action, tenantId, duration, 'success']
      );
    } catch (e: any) {
      this.logger.error(`Failed to log audit: ${e.message}`);
    }
  }
}
