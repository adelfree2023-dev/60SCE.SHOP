import { Pool } from 'pg';

async function main() {
    console.log('📝 Setting up unique fingerprints for all tenants...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const tenantsResult = await pool.query("SELECT subdomain FROM public.tenants");
        const tenants = tenantsResult.rows;

        for (const tenant of tenants) {
            const subdomain = tenant.subdomain;
            const schemaName = `tenant_${subdomain}`;

            console.log(`Setting fingerprint for ${schemaName}...`);
            try {
                // Check if schema exists
                const schemaCheck = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1", [schemaName]);
                if (schemaCheck.rows.length === 0) {
                    console.warn(`Schema ${schemaName} not found, skipping.`);
                    continue;
                }

                // Insert fingerprint into settings table
                await pool.query(`
                    INSERT INTO "${schemaName}".settings (key, value) 
                    VALUES ('tenant_fingerprint', $1) 
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                `, [`SECRET_FOR_${subdomain}`]);
                console.log(`✅ Set fingerprint for ${subdomain}`);
            } catch (error: any) {
                console.error(`Failed for ${schemaName}: ${error.message}`);
            }
        }
    } catch (error: any) {
        console.error(`Query failed: ${error.message}`);
    }

    await pool.end();
    console.log('✅ Fingerprint setup complete!');
}

main();
