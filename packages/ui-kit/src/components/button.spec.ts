import { describe, it, expect } from 'bun:test';
import { buttonVariants } from './button';

describe('Button Design Tokens', () => {
    it('should implement accessible focus rings', () => {
        const classes = buttonVariants();
        expect(classes).toContain('focus-visible:ring-2');
        expect(classes).toContain('focus-visible:ring-offset-2');
    });

    it('should implement destructive variant strictly', () => {
        const classes = buttonVariants({ variant: 'destructive' });
        expect(classes).toContain('bg-destructive');
        expect(classes).toContain('text-destructive-foreground');
    });

    it('should support size variants', () => {
        const sm = buttonVariants({ size: 'sm' });
        const lg = buttonVariants({ size: 'lg' });
        expect(sm).toContain('h-9');
        expect(lg).toContain('h-11');
    });
});
