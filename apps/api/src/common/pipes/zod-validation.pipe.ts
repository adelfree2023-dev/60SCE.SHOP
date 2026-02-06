import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { ZodSchema, z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    private readonly logger = new Logger(ZodValidationPipe.name);

    constructor(private schema?: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        // [SEC] S3: Input Sanitization & Validation
        if (!['body', 'query', 'param'].includes(metadata.type)) {
            return value;
        }

        const sanitized = this.sanitizeRecursive(value);

        if (this.schema) {
            try {
                return this.schema.parse(sanitized);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    this.logger.warn(`Validation failed for ${metadata.type}: ${JSON.stringify(error.flatten().fieldErrors)}`);
                    throw new BadRequestException({
                        message: 'Validation failed',
                        errors: error.flatten().fieldErrors,
                    });
                }
                throw new BadRequestException('Validation failed');
            }
        }

        return sanitized;
    }

    private sanitizeRecursive(obj: any): any {
        if (typeof obj === 'string') {
            return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeRecursive(item));
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, this.sanitizeRecursive(v)])
            );
        }
        return obj;
    }
}
