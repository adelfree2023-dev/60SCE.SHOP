import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PiiSupportService } from './pii-support.service';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { EncryptionModule } from '@apex/encryption';

@Module({
    imports: [ProvisioningModule, EncryptionModule],
    controllers: [TenantsController],
    providers: [TenantsService, PiiSupportService],
    exports: [TenantsService, PiiSupportService],
})
export class TenantsModule { }
