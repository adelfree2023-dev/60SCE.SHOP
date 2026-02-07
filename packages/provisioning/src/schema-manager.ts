/**
 * Schema Manager
 * Handles PostgreSQL schema lifecycle for tenant isolation (S2)
 */

import { publicPool } from '@apex/db';

export interface SchemaCreationResult {
  schemaName: string;
  createdAt: Date;
  durationMs: number;
}

export interface SchemaVerificationResult {
  exists: boolean;
  tableCount: number;
  schemaName: string;
}

/**
 * Create a new tenant-specific schema
 * @param subdomain - Tenant subdomain (used as schema identifier)
 * @returns Schema creation metadata
 * @throws Error if schema already exists or creation fails
 */
export async function createTenantSchema(
  subdomain: string
): Promise<SchemaCreationResult> {
  const schemaName = sanitizeSchemaName(subdomain);
  const startTime = performance.now();

  const client = await publicPool.connect();

  try {
    // Check if schema already exists
    const existing = await client.query(
      `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `,
      [schemaName]
    );

    if (existing.rows.length > 0) {
      throw new Error(`Schema '${schemaName}' already exists`);
    }

    // Create schema with proper authorization
    await client.query(`
      CREATE SCHEMA "${schemaName}";
      GRANT ALL ON SCHEMA "${schemaName}" TO CURRENT_USER;
    `);

    const durationMs = performance.now() - startTime;

    return {
      schemaName,
      createdAt: new Date(),
      durationMs,
    };
  } finally {
    client.release();
  }
}

/**
 * Verify if tenant schema exists and count tables
 * @param subdomain - Tenant subdomain
 * @returns Verification result with table count
 */
export async function verifySchemaExists(
  subdomain: string
): Promise<SchemaVerificationResult> {
  const schemaName = sanitizeSchemaName(subdomain);
  const client = await publicPool.connect();

  try {
    const schemaCheck = await client.query(
      `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `,
      [schemaName]
    );

    const exists = schemaCheck.rows.length > 0;

    let tableCount = 0;
    if (exists) {
      const tableCheck = await client.query(
        `
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = $1
      `,
        [schemaName]
      );
      tableCount = Number.parseInt(tableCheck.rows[0].count, 10);
    }

    return {
      exists,
      tableCount,
      schemaName,
    };
  } finally {
    client.release();
  }
}

/**
 * Safely drop a tenant schema (CASCADE)
 * @param subdomain - Tenant subdomain
 * @param verifyEmpty - If true, only drops if schema has no tables (safety)
 * @returns true if dropped, false if didn't exist
 */
export async function dropTenantSchema(
  subdomain: string,
  verifyEmpty = false
): Promise<boolean> {
  const schemaName = sanitizeSchemaName(subdomain);
  const client = await publicPool.connect();

  try {
    // Check existence first
    const check = await client.query(
      `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `,
      [schemaName]
    );

    if (check.rows.length === 0) {
      return false; // Didn't exist
    }

    // Safety check: verify empty if requested
    if (verifyEmpty) {
      const tableCheck = await client.query(
        `
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = $1
      `,
        [schemaName]
      );

      if (Number.parseInt(tableCheck.rows[0].count, 10) > 0) {
        throw new Error(
          `Schema '${schemaName}' is not empty. Use verifyEmpty=false to force drop.`
        );
      }
    }

    // Drop schema with cascade
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

    return true;
  } finally {
    client.release();
  }
}

/**
 * Sanitize subdomain to valid PostgreSQL schema name
 * @param subdomain - Raw subdomain
 * @returns Valid schema name (tenant_{sanitized})
 */
export function sanitizeSchemaName(subdomain: string): string {
  const clean = subdomain.toLowerCase().trim();

  // Strict S2 Validation: Reject special characters
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    throw new Error('Invalid subdomain');
  }

  // PG identifiers can't start with numbers (but we prefix with tenant_ so it's usually safe, 
  // but let's keep the internal logic consistent)
  const sanitized = clean.replace(/^[0-9]/, '_$&');

  if (sanitized.length < 3) {
    throw new Error('Invalid subdomain: too short');
  }

  if (sanitized.length > 50) {
    throw new Error('Invalid subdomain: exceeds 50 character limit');
  }

  return `tenant_${sanitized}`;
}

/**
 * List all tenant schemas in database
 * @returns Array of schema names
 */
export async function listTenantSchemas(): Promise<string[]> {
  const client = await publicPool.connect();

  try {
    const result = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    return result.rows.map((row) => row.schema_name as string);
  } finally {
    client.release();
  }
}
