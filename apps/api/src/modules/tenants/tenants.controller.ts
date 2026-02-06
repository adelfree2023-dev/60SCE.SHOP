import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantQuery } from './tenant.dto';
import { SuperAdminGuard } from '@apex/security';

@Controller('tenants')
@UseGuards(SuperAdminGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) {}

    @Get()
    async findAll(@Query() query: TenantQuery) {
        return this.tenantsService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }
}
