import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { AddressService } from './address.service';
import { WalletService } from './wallet.service';
import { WishlistService } from './wishlist.service';
import { EncryptionService } from '@apex/encryption';

@Module({
    controllers: [CustomerController],
    providers: [
        CustomerService,
        AddressService,
        WalletService,
        WishlistService,
        EncryptionService,
    ],
    exports: [CustomerService, AddressService, WalletService, WishlistService],
})
export class CustomerModule { }
