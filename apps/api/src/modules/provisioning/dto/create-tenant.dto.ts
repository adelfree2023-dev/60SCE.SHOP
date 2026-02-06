import { CreateTenantDto as ICreateTenantDto } from '@apex/validators';
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateTenantDto implements ICreateTenantDto {
    @IsString()
    @IsNotEmpty()
    subdomain: string;

    @IsEmail()
    @IsNotEmpty()
    ownerEmail: string;

    @IsString()
    @IsNotEmpty()
    storeName: string;

    @IsEnum(['basic', 'pro', 'enterprise'])
    @IsNotEmpty()
    planId: 'basic' | 'pro' | 'enterprise';

    @IsString()
    @IsOptional()
    blueprintId: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    confirmPassword?: string;
}
