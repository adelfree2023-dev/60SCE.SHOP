import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function runAudit() {
    const rootDir = path.resolve(__dirname, '..');
    process.chdir(rootDir); 
    console.log('í»¡ï¸ Starting Constitutional Audit (Sequential Mode at ' + rootDir + ')...');
    
    const files = await glob('**/*.{ts,tsx}', { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/scripts/constitutional-audit.ts'] 
    });

    let violations = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Use split strings to avoid self-match if this script didn't ignore itself
        const pattern1 = 'from "' + 'apps/';
        const pattern2 = 'from \'' + 'apps/';

        if (content.includes(pattern1) || content.includes(pattern2)) {
            // Check if it's the structure.ts tool which is allowed to mention the rule
            if (file.includes('structure.ts')) continue;

            console.error('âŒ RULE 1.1: Cross-app import in ' + file);
            violations++;
        }
    }

    if (violations === 0) {
        console.log('âœ… AUDIT PASSED: 100% Constitution Compliance.');
    } else {
        console.error('í»‘ AUDIT FAILED: Found ' + violations + ' critical violations.');
        process.exit(1);
    }
}

runAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
