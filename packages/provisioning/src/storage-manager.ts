/**
 * Storage Manager
 * Handles multi-tenant bucket isolation using MinIO/S3 (S3 Protocol)
 */

import { validateEnv } from '@apex/config';
import * as Minio from 'minio';

// Initialize client from environment
const getClient = () => {
  const env = validateEnv();
  return new Minio.Client({
    endPoint: env.S3_ENDPOINT,
    port: env.S3_PORT,
    useSSL: env.S3_USE_SSL,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
  });
};

export interface BucketCreationResult {
  bucketName: string;
  region: string;
  createdAt: Date;
}

/**
 * Create a new isolated storage bucket for a tenant
 * @param subdomain - Tenant subdomain (used as bucket name basis)
 * @returns Bucket creation metadata
 * @throws Error if bucket creation fails
 */
export async function createTenantBucket(
  subdomain: string
): Promise<BucketCreationResult> {
  const client = getClient();
  const bucketName = sanitizeBucketName(subdomain);
  const region = 'us-east-1'; // Default region

  try {
    const exists = await client.bucketExists(bucketName);

    if (exists) {
      throw new Error(`Bucket '${bucketName}' already exists`);
    }

    await client.makeBucket(bucketName, region);

    // Set default lifecycle policy (e.g., delete temp files after 24h)
    // In a real implementation, we'd apply a JSON policy here

    return {
      bucketName,
      region,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error(`Bucket creation failed for ${bucketName}:`, error);
    throw new Error(
      `Storage Provisioning Failure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a tenant's storage bucket (WARNING: Destructive)
 * @param subdomain - Tenant subdomain
 */
export async function deleteTenantBucket(subdomain: string): Promise<boolean> {
  const client = getClient();
  const bucketName = sanitizeBucketName(subdomain);

  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) return false;

    // Note: Standard S3 requires bucket to be empty before deletion
    // For this engine, we'd either force recursive delete or throw
    await client.removeBucket(bucketName);
    return true;
  } catch (error) {
    throw new Error(
      `Storage Deletion Failure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Sanitize subdomain to valid S3 bucket name
 * Rules: 3-63 chars, lowercase, numbers, hyphens only
 * @param subdomain - Raw subdomain
 * @returns Valid bucket name (apex-{sanitized})
 */
export function sanitizeBucketName(subdomain: string): string {
  const sanitized = subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  if (sanitized.length < 3) {
    throw new Error(
      `Invalid bucket name basis '${subdomain}': too short after sanitization`
    );
  }

  const finalName = `apex-tenant-${sanitized}`;

  if (finalName.length > 63) {
    return finalName.substring(0, 63);
  }

  return finalName;
}

/**
 * Get bucket usage statistics
 * @param subdomain - Tenant subdomain
 */
export async function getBucketStats(subdomain: string) {
  const client = getClient();
  const bucketName = sanitizeBucketName(subdomain);

  let totalSize = 0;
  let objectCount = 0;

  return new Promise((resolve, reject) => {
    const stream = client.listObjects(bucketName, '', true);
    stream.on('data', (obj) => {
      totalSize += obj.size;
      objectCount++;
    });
    stream.on('error', reject);
    stream.on('end', () => resolve({ totalSize, objectCount }));
  });
}
