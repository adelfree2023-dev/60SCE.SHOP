import { SKIP_TENANT_SCOPE_KEY, SkipTenantScope } from './skip-tenant-scope.decorator';
import { Reflector } from '@nestjs/core';

describe('SkipTenantScope Decorator', () => {
    class TestClass {
        @SkipTenantScope()
        testMethod() { }
    }

    it('should set metadata key "skipTenantScope" to true', () => {
        const reflector = new Reflector();
        const metadata = reflector.get(SKIP_TENANT_SCOPE_KEY, TestClass.prototype.testMethod);
        expect(metadata).toBe(true);
    });
});
