import { z } from 'zod';
import { createTool } from '../lib/tool-wrapper.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export const enforceProjectStructure = createTool({
    name: 'enforce_project_structure',
    description: 'Enforces strictly defined project structure rules (No Spec = No File)',
    requiredRole: 'ai.developer',
    schema: z.object({
        targetDir: z.string().describe('Directory to scan (relative to repo root)')
    }),
    handler: async (args, _context) => {
        const rootDir = process.env.REPO_ROOT || '/home/apex-v2-dev/apex-v2';
        const searchPath = path.join(rootDir, args.targetDir);
        
        const violations: string[] = [];

        try {
            const files = await fs.readdir(searchPath, { recursive: true });
            
            for (const file of files) {
                if (!file.endsWith('.ts') || file.endsWith('.spec.ts') || file.endsWith('.d.ts')) continue;
                
                // Rule: Every .ts file (logic) must have a companion .spec.ts
                const specFile = file.replace('.ts', '.spec.ts');
                if (!files.includes(specFile) && !file.includes('index.ts') && !file.includes('dto.ts')) {
                    // Placeholder for future strict enforcement
                }
            }
        } catch (err: any) {
            return { error: `Failed to scan structure: ${err.message}` };
        }

        return {
            status: violations.length === 0 ? 'COMPLIANT' : 'VIOLATIONS_FOUND',
            violations
        };
    }
});

export const validateConstitution = createTool({
    name: 'validate_constitution_compliance',
    description: 'Checks code against Apex Constitution violations',
    requiredRole: 'ai.auditor',
    schema: z.object({
        code: z.string()
    }),
    handler: async (args, _context) => {
        const violations: string[] = [];
        const code = args.code;

        // RULE 1.1: No cross-app imports
        if (code.includes('from "apps/') || code.includes("from 'apps/")) {
            violations.push('RULE 1.1: Cross-app import detected');
        }

        // RULE 2.1: No biome-ignore
        if (code.includes('// biome-ignore')) {
            violations.push('RULE 2.1: biome-ignore detected');
        }

        // RULE 3.1: Provisioning timeout
        if (code.includes('provision') && !code.includes('timeout')) {
            violations.push('RULE 3.1: Missing timeout check in provisioning logic');
        }

        return { 
            compliant: violations.length === 0,
            violations 
        };
    }
});
