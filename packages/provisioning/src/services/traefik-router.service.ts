import { Injectable, Logger } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';

@Injectable()
export class TraefikRouterService {
    private readonly logger = new Logger(TraefikRouterService.name);
    private readonly dynamicConfigDir = process.env.TRAEFIK_DYNAMIC_DIR || './infra/docker/traefik/dynamic';

    /**
     * Creates dynamic Traefik route for tenant
     * @param subdomain - Tenant subdomain (e.g., 'myshop')
     * @param targetService - Target service (e.g., 'storefront@docker')
     */
    async createRoute(subdomain: string, targetService: string = 'storefront@docker'): Promise<void> {
        // [CRITICAL-008] Security Shield: Strict Subdomain Validation
        if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(subdomain)) {
            throw new Error(`Invalid subdomain: ${subdomain}`);
        }

        const startTime = Date.now();
        const routeName = `${subdomain}-route`;

        this.logger.log(`Creating Traefik route: ${routeName}`);

        try {
            // Ensure directory exists
            await mkdir(this.dynamicConfigDir, { recursive: true });

            // Generate dynamic configuration
            const config = {
                http: {
                    routers: {
                        [routeName]: {
                            rule: `Host(\`${subdomain}.apex.localhost\`)`,
                            service: targetService,
                            entryPoints: ['web'],
                            middlewares: ['tenant-isolation']
                        }
                    },
                    services: {
                        [targetService]: {
                            loadBalancer: {
                                servers: [
                                    { url: `http://${targetService.split('@')[0]}:3000` }
                                ]
                            }
                        }
                    },
                    middlewares: {
                        'tenant-isolation': {
                            headers: {
                                customRequestHeaders: {
                                    'X-Tenant-Id': subdomain
                                }
                            }
                        }
                    }
                }
            };

            // [CRITICAL-008] Secure YAML Generation using js-yaml
            const yamlContent = yaml.dump(config, {
                indent: 2,
                quotingType: '"',
            });
            const filePath = join(this.dynamicConfigDir, `${routeName}.yml`);

            await writeFile(filePath, yamlContent, 'utf-8');

            const duration = Date.now() - startTime;
            this.logger.log(`✅ Traefik route created in ${duration}ms: ${filePath}`);
        } catch (error: any) {
            this.logger.error(`Failed to create Traefik route: ${error.message}`);
            throw error;
        }
    }

    /**
     * Removes Traefik route for tenant
     */
    async removeRoute(subdomain: string): Promise<void> {
        const routeName = `${subdomain}-route`;
        const filePath = join(this.dynamicConfigDir, `${routeName}.yml`);

        try {
            // File removal handled by deployment script
            this.logger.log(`Route removal scheduled: ${routeName}`);
        } catch (error: any) {
            this.logger.error(`Failed to remove route: ${error.message}`);
        }
    }

}
