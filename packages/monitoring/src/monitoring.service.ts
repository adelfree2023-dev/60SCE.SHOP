import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class MonitoringService implements OnModuleInit {
    private readonly logger = new Logger(MonitoringService.name);
    private isInitialized = false;

    async onModuleInit() {
        const dsn = process.env.SENTRY_DSN || process.env.GLITCHTIP_DSN;

        if (!dsn) {
            this.logger.warn('⚠️  No SENTRY_DSN or GLITCHTIP_DSN configured - monitoring disabled');
            return;
        }

        try {
            Sentry.init({
                dsn,
                environment: process.env.NODE_ENV || 'development',
                tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
                beforeSend(event) {
                    // Don't send events in development unless explicitly enabled
                    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
                        return null;
                    }
                    return event;
                },
            });

            this.isInitialized = true;
            this.logger.log('✅ Monitoring service initialized (Sentry/GlitchTip)');
        } catch (error: any) {
            this.logger.error(`Failed to initialize monitoring: ${error.message}`);
        }
    }

    captureException(exception: Error, context?: Record<string, any>) {
        if (!this.isInitialized) {
            this.logger.debug('Monitoring not initialized - exception not captured');
            return;
        }

        try {
            Sentry.captureException(exception, {
                contexts: context ? { extra: context } : undefined,
            });
        } catch (error: any) {
            this.logger.error(`Failed to capture exception: ${error.message}`);
        }
    }

    captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info') {
        if (!this.isInitialized) {
            return;
        }

        Sentry.captureMessage(message, level);
    }

    setUser(userId: string, email?: string, username?: string) {
        if (!this.isInitialized) {
            return;
        }

        Sentry.setUser({
            id: userId,
            email,
            username,
        });
    }

    clearUser() {
        if (!this.isInitialized) {
            return;
        }

        Sentry.setUser(null);
    }

    addBreadcrumb(message: string, data?: Record<string, any>) {
        if (!this.isInitialized) {
            return;
        }

        Sentry.addBreadcrumb({
            message,
            data,
            timestamp: Date.now() / 1000,
        });
    }

    startTransaction(name: string, op: string = 'task') {
        if (!this.isInitialized) {
            return null;
        }

        return Sentry.startTransaction({ name, op });
    }
}
