/**
 * @apex/provisioning
 * The 60-Second Store Provisoning Engine
 */

export * from './quota-service.js';
export * from './runner.js';
export * from './schema-manager.js';
export * from './seeder.js';
export * from './storage-manager.js';

export interface ProvisioningOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
}

export interface ProvisioningResult {
  tenantId: string;
  subdomain: string;
  dbSchema: string;
  storageBucket: string;
  provisionedAt: Date;
  status: 'complete' | 'failed';
}
