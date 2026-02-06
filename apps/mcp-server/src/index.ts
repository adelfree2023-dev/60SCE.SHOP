import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolContext } from './lib/tool-wrapper.js';

// Tools
import { listTenantsTool } from './tools/tenants.js';
import { validateTenantIsolation, auditSqlInjection } from './tools/security.js';
import { provisionTenant } from './tools/provisioning.js';
import { enforceProjectStructure, validateConstitution } from './tools/structure.js';

// Global DB Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Tool Registry
const tools = [
    listTenantsTool,
    validateTenantIsolation,
    auditSqlInjection,
    provisionTenant,
    enforceProjectStructure,
    validateConstitution
];

const server = new Server(
    {
        name: '@apex/mcp-server',
        version: '0.0.1',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: zodToJsonSchema(t.schema) as any
        }))
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
        throw new Error('Unknown tool');
    }

    // Determine Role
    const toolContext: ToolContext = {
        requestRole: 'ai.deployer', 
        pool
    };

    return tool.execute(request.params.arguments, toolContext);
});

const transport = new StdioServerTransport();
await server.connect(transport);
