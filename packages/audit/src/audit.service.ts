/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */

import { publicPool } from '@apex/db';
import { getCurrentTenantId } from '@apex/middleware';
import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  /**
   * Log a security or system event
   * S4: This logs to an immutable table in the public schema
   * @param entry - Audit log data
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const tenantId = entry.tenantId || getCurrentTenantId() || 'system';
    const timestamp = new Date();

    // 1. Console Logging (for immediate observability)
    this.logger.log(
      `[AUDIT] ${tenantId} | ${entry.action} | ${entry.entityType}:${entry.entityId}`
    );

    // 2. Persistent Logging (S4 Protocol)
    // In S4, we insert into public.audit_logs which has triggers
    // to prevent any UPDATE or DELETE operations.
    const client = await publicPool.connect();

    try {
      await client.query(
        `
        INSERT INTO public.audit_logs (
          tenant_id, 
          user_id, 
          action, 
          entity_type, 
          entity_id, 
          metadata, 
          ip_address, 
          user_agent,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          tenantId,
          entry.userId || null,
          entry.action,
          entry.entityType,
          entry.entityId,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress || null,
          entry.userAgent || null,
          timestamp,
        ]
      );
    } catch (error) {
      // Critical failure if audit logging fails
      this.logger.error(`S4 VIOLATION: Failed to persist audit log!`, error);
      // In high-security mode, we might want to crash the process here
      // throw new Error('Audit Persistence Failure');
    } finally {
      client.release();
    }
  }

  /**
   * Initialize S4 Protection
   * Ensures the audit_logs table and its immutability triggers exist
   */
  async initializeS4(): Promise<void> {
    const client = await publicPool.connect();
    try {
      // 1. Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id TEXT NOT NULL,
          user_id TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          metadata JSONB,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 2. Create immutability triggers
      // Prevent UPDATE
      await client.query(`
        CREATE OR REPLACE FUNCTION protect_audit_log_update() RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'S4 Violation: Audit logs are immutable and cannot be updated.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_audit_update ON public.audit_logs;
        CREATE TRIGGER trg_protect_audit_update 
        BEFORE UPDATE ON public.audit_logs 
        FOR EACH ROW EXECUTE FUNCTION protect_audit_log_update();
      `);

      // Prevent DELETE
      await client.query(`
        CREATE OR REPLACE FUNCTION protect_audit_log_delete() RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'S4 Violation: Audit logs are immutable and cannot be deleted.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_audit_delete ON public.audit_logs;
        CREATE TRIGGER trg_protect_audit_delete 
        BEFORE DELETE ON public.audit_logs 
        FOR EACH ROW EXECUTE FUNCTION protect_audit_log_delete();
      `);

      this.logger.log('S4 Immutable Auditing active.');
    } finally {
      client.release();
    }
  }
}
