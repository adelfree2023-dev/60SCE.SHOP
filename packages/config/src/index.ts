import { getEnv } from './env';

export * from './env';

export function validateEnv() {
    return getEnv();
}
