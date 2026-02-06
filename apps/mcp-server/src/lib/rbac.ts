export type AIRole = 'ai.auditor' | 'ai.developer' | 'ai.deployer';

export const AI_PERMISSIONS: Record<AIRole, string[]> = {
    'ai.auditor': ['read', 'analyze', 'audit'],
    'ai.developer': ['read', 'write', 'test', 'analyze', 'audit'],
    'ai.deployer': ['read', 'write', 'test', 'analyze', 'audit', 'deploy']
};

export const canExecute = (currentRole: AIRole, requiredRole: AIRole): boolean => {
    // Simple hierarchy: deployer > developer > auditor
    const levels: Record<AIRole, number> = {
        'ai.auditor': 1,
        'ai.developer': 2,
        'ai.deployer': 3
    };
    return levels[currentRole] >= levels[requiredRole];
};
