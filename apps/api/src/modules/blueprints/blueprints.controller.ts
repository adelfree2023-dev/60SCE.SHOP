import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, Logger } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateBlueprintDto, UpdateBlueprintDto } from './dto';
import { BlueprintSchema } from './schemas/blueprint.schema';
import { BlueprintsService } from './blueprints.service';
import { SkipTenantScope } from '@apex/security';

@Controller('api/blueprints')
@SkipTenantScope()
export class BlueprintsController {
    private readonly logger = new Logger(BlueprintsController.name);

    constructor(private readonly blueprintsService: BlueprintsService) { }

    @Get()
    async findAll() {
        return this.blueprintsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.blueprintsService.findOne(id);
    }

    @Post()
    async create(
        @Body(new ZodValidationPipe(BlueprintSchema)) createDto: CreateBlueprintDto,
    ) {
        return this.blueprintsService.create(createDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(BlueprintSchema.partial())) updateDto: UpdateBlueprintDto,
    ) {
        return this.blueprintsService.update(id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.blueprintsService.remove(id);
    }
}
