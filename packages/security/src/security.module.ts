import { Module, Global } from '@nestjs/common';
import { SecretsRotatorService } from './services/secrets-rotator.service';

@Global()
@Module({
    providers: [SecretsRotatorService],
    exports: [SecretsRotatorService],
})
export class SecurityModule { }
