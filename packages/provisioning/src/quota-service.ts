/**
 * Quota Service
 * Enforces plan limits and resource quotas for tenants
 */

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxProducts: number;
  maxStorageMb: number;
  maxUsers: number;
  customDomain: boolean;
  prioritySupport: boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxProducts: 10,
    maxStorageMb: 100,
    maxUsers: 1,
    customDomain: false,
    prioritySupport: false,
  },
  basic: {
    maxProducts: 100,
    maxStorageMb: 1000,
    maxUsers: 3,
    customDomain: true,
    prioritySupport: false,
  },
  pro: {
    maxProducts: 1000,
    maxStorageMb: 10000,
    maxUsers: 10,
    customDomain: true,
    prioritySupport: true,
  },
  enterprise: {
    maxProducts: 999999,
    maxStorageMb: 999999,
    maxUsers: 99,
    customDomain: true,
    prioritySupport: true,
  },
};

/**
 * Get limits for a specific plan
 * @param plan - Plan identifier
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if a tenant can perform an action based on their quota
 * @param currentUsage - Current resource count
 * @param plan - Tenant plan
 * @param resourceType - Resource to check
 * @returns boolean indicating if allowed
 */
export function checkQuota(
  currentUsage: number,
  plan: PlanType,
  resourceType: keyof Pick<
    PlanLimits,
    'maxProducts' | 'maxStorageMb' | 'maxUsers'
  >
): boolean {
  const limits = getPlanLimits(plan);
  return currentUsage < limits[resourceType];
}
