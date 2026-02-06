import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { db } from '@apex/db';
import { EncryptionModule } from '@apex/encryption';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { SchemaCreatorService, DataSeederService, TraefikRouterService } from '@apex/provisioning';
import { IdentityModule } from '../identity/identity.module';
import { MailModule } from '../mail/mail.module';

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'apex-api',
    max: 200, // [SEC] Expanded for high parallel test load
    min: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

@Global()
@Module({
    imports: [EncryptionModule, IdentityModule, MailModule],
    controllers: [ProvisioningController],
    providers: [
        {
            provide: 'PROVISIONING_SERVICE',
            useClass: ProvisioningService,
        },
        {
            provide: 'SCHEMA_CREATOR_SERVICE',
            useClass: SchemaCreatorService,
        },
        {
            provide: 'DATA_SEEDER_SERVICE',
            useClass: DataSeederService,
        },
        {
            provide: 'TRAEFIK_ROUTER_SERVICE',
            useClass: TraefikRouterService,
        },
        {
            provide: Pool,
            useValue: dbPool,
        },
        {
            provide: 'BoundPool',
            useValue: dbPool,
        },
        {
            provide: 'DATABASE_POOL',
            useValue: dbPool,
        },
        {
            provide: 'DATABASE_CONNECTION',
            useValue: db,
        },
        ProvisioningService,
        SchemaCreatorService,
        DataSeederService,
        TraefikRouterService,
    ],
    exports: [
        ProvisioningService,
        'PROVISIONING_SERVICE',
        'SCHEMA_CREATOR_SERVICE',
        'DATA_SEEDER_SERVICE',
        'TRAEFIK_ROUTER_SERVICE',
        Pool,
        'BoundPool',
        'DATABASE_POOL',
    ],
})
export class ProvisioningModule { }
