import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProvisioningModule } from './provisioning/provisioning.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProvisioningModule],
})
export class AppModule {}
