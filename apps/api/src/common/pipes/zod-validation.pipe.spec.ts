import { describe, it, expect, mock } from 'bun:test';
import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe (S3)', () => {
    it('should validate and transform body', () => {
        const schema = z.object({ name: z.string() });
        const pipe = new ZodValidationPipe(schema);
        const metadata: any = { type: 'body' };

        const result = pipe.transform({ name: 'test' }, metadata);
        expect(result).toEqual({ name: 'test' });
    });

    it('should throw BadRequestException on validation failure', () => {
        const schema = z.object({ age: z.number() });
        const pipe = new ZodValidationPipe(schema);
        const metadata: any = { type: 'body' };

        // We expect it to throw a NestJS exception
        try {
            pipe.transform({ age: 'string' }, metadata);
            expect(true).toBe(false); // Should fail if no error
        } catch (e) {
            expect(e).toBeInstanceOf(BadRequestException);
        }
    });

    it('should ignore non-body arguments', () => {
        const schema = z.object({});
        const pipe = new ZodValidationPipe(schema);
        const metadata: any = { type: 'query' };

        const result = pipe.transform('some_value', metadata);
        expect(result).toBe('some_value');
    });
});
