import { Module } from '@nestjs/common';
import { AdminCustomerController } from './admin-customer.controller';
import { CustomerModule } from '../customer/customer.module';

@Module({
    imports: [CustomerModule],
    controllers: [AdminCustomerController],
})
export class AdminModule { }
