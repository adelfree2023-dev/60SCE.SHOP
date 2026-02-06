import { z } from 'zod';
import { Pool } from 'pg';
import { AIRole, canExecute } from './rbac.js';
import { AuditLogger } from './audit.js';

export interface ToolContext {
    requestRole: AIRole;
    pool: Pool;
}

export interface ToolDefinition<T extends z.ZodType> {
    name: string;
    description: string;
    schema: T;
    requiredRole: AIRole;
    handler: (args: z.infer<T>, context: ToolContext) => Promise<any>;
}

export const createTool = <T extends z.ZodType>(tool: ToolDefinition<T>) => {
    return {
        ...tool,
        execute: async (args: any, context: ToolContext) => {
            const audit = new AuditLogger(context.pool);
            const { requestRole } = context;

            // 1. RBAC Check
            if (!canExecute(requestRole, tool.requiredRole)) {
                await audit.log({
                    action: `TOOL_EXECUTION_DENIED:${tool.name}`,
                    resource: tool.name,
                    status: 'failure',
                    error: `Role ${requestRole} insufficient for ${tool.requiredRole}`
                });
                throw new Error(`Permission Denied: ${tool.name} requires ${tool.requiredRole}`);
            }

            // 2. Schema Validation (Input Guard - S3)
            const parseResult = tool.schema.safeParse(args);
            if (!parseResult.success) {
                await audit.log({
                    action: `TOOL_VALIDATION_FAILED:${tool.name}`,
                    resource: tool.name,
                    status: 'failure',
                    error: parseResult.error.message,
                    metadata: { args }
                });
                throw new Error(`Validation Failed: ${parseResult.error.message}`);
            }

            // 3. Execution & Auditing (Logic -> S4)
            try {
                const result = await tool.handler(parseResult.data, context);
                
                await audit.log({
                    action: `TOOL_EXECUTION:${tool.name}`,
                    resource: tool.name,
                    status: 'success',
                    metadata: { args } // Be careful not to log secrets
                });

                return result;
            } catch (error: any) {
                await audit.log({
                    action: `TOOL_EXECUTION_ERROR:${tool.name}`,
                    resource: tool.name,
                    status: 'failure',
                    error: error.message,
                    metadata: { args }
                });
                throw error;
            }
        }
    };
};
