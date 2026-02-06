import { z } from 'zod';
import { createTool } from '../lib/tool-wrapper.js';

export const validateTenantIsolation = createTool({
    name: 'validate_tenant_isolation',
    description: 'Validates SQL queries against cross-tenant leakage (S2 Compliance)',
    requiredRole: 'ai.auditor',
    schema: z.object({
        sql: z.string().min(10).describe('The SQL query to analyze'),
        tenantId: z.string().uuid().describe('The target tenant UUID')
    }),
    handler: async (args, context) => {
        const { sql, tenantId } = args;
        const violations: string[] = [];

        // Rule 1: Must explicitly filter by tenant_id or use schema
        const hasTenantFilter = sql.includes('tenant_id') || sql.includes(`tenant_${tenantId}`);
        if (!hasTenantFilter) {
            violations.push('CRITICAL: SQL query lacks explicit tenant_id filter or schema scope.');
        }

        // Rule 2: No CROSS JOINs (risk of leakage)
        if (sql.toUpperCase().includes('CROSS JOIN')) {
            violations.push('WARNING: CROSS JOIN detected. High risk of data leakage.');
        }

        // Rule 3: Public schema usage check
        if (sql.includes('public.') && !sql.includes('tenants') && !sql.includes('users')) {
            violations.push('Suspicious access to public schema tables.');
        }

        const isSafe = violations.length === 0;

        return {
            isSafe,
            violations,
            audit: isSafe ? 'PASSED_S2_CHECK' : 'FAILED_S2_CHECK'
        };
    }
});

export const auditSqlInjection = createTool({
    name: 'audit_sql_injection_risk',
    description: 'Analyzes parameters for SQL Injection risks',
    requiredRole: 'ai.auditor',
    schema: z.object({
        params: z.array(z.any()).describe('Query parameters')
    }),
    handler: async (args, _context) => {
        const risks: string[] = [];
        
        args.params.forEach((p, i) => {
            if (typeof p === 'string') {
                if (p.includes('OR 1=1') || p.includes('DROP TABLE') || p.includes('--')) {
                    risks.push(`Param [${i}] contains SQL Injection signature.`);
                }
            }
        });

        return {
            safe: risks.length === 0,
            risks
        };
    }
});
