import { execSync } from 'child_process';

async function main() {
    console.log('🚀 Mass provisioning 47 additional tenants for Nuclear Load Test...');

    for (let i = 1; i <= 47; i++) {
        const subdomain = `tenant-${i}`;
        const email = `admin-${i}@example.com`;
        const name = `Tenant ${i}`;

        console.log(`[${i}/47] Provisioning ${subdomain}...`);
        try {
            // Using the existing provision-tenant script
            execSync(`bun /app/scripts/provision-tenant.ts --store-name=${subdomain} --owner-email=${email}`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Failed to provision ${subdomain}`);
        }
    }

    console.log('✅ Mass provisioning complete!');
}

main();
