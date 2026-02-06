import { Pool } from 'pg';

export interface AuditEntry {
    action: string;
    resource: string;
    status: 'success' | 'failure';
    metadata?: any;
    error?: string;
}

export class AuditLogger {
    constructor(private pool: Pool) {}

    async log(entry: AuditEntry) {
        // Enforce Immutable Logging (S4)
        const query = `
            INSERT INTO public.audit_logs (
                action, 
                resource, 
                actor_id, 
                ip_address, 
                status, 
                metadata, 
                user_agent
            ) VALUES (, , , , , , )
        `;

        try {
            await this.pool.query(query, [
                entry.action,
                entry.resource,
                'ai-agent-001', // Fixed AI Actor ID
                '127.0.0.1',    // Internal
                entry.status,
                JSON.stringify({ ...entry.metadata, agent_type: 'ai' }), // Tagging
                'MCP-Server/1.0'
            ]);
        } catch (err) {
            console.error('CRITICAL: Failed to write audit log', err);
            // In a strict environment, we might panic here, but for now we log to stderr
        }
    }
}
