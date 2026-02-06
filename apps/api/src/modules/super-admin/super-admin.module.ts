import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [EmailController],
})
export class SuperAdminModule {}
