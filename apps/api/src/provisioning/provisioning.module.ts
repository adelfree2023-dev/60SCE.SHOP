import { AuditService } from '@apex/audit';
import { Module } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  controllers: [ProvisioningController],
  providers: [ProvisioningService, AuditService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
