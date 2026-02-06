import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantsModule } from '../tenants/tenants.module';
import { RedisModule } from '@apex/redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
    imports: [
        TenantsModule,
        RedisModule,
        ProvisioningModule,
        PassportModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule { }

