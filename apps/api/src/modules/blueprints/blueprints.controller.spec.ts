import { Test, TestingModule } from '@nestjs/testing';
import { BlueprintsController } from './blueprints.controller';
import { BlueprintsService } from './blueprints.service';

describe('BlueprintsController', () => {
    let controller: BlueprintsController;
    let service: BlueprintsService;

    const mockBlueprintsService = {
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Standard' }),
        create: jest.fn().mockResolvedValue({ id: '2', name: 'Pro' }),
        update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
        remove: jest.fn().mockResolvedValue({ success: true }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlueprintsController],
            providers: [
                {
                    provide: BlueprintsService,
                    useValue: mockBlueprintsService,
                },
            ],
        }).compile();

        controller = module.get<BlueprintsController>(BlueprintsController);
        service = module.get<BlueprintsService>(BlueprintsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all blueprints', async () => {
        const result = await controller.findAll();
        expect(result).toEqual([]);
        expect(service.findAll).toHaveBeenCalled();
    });

    it('should return one blueprint', async () => {
        const result = await controller.findOne('1');
        expect(result).toEqual({ id: '1', name: 'Standard' });
        expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should create a blueprint', async () => {
        const dto = { name: 'Pro', description: 'Pro plan' } as any;
        const result = await controller.create(dto);
        expect(result).toEqual({ id: '2', name: 'Pro' });
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should update a blueprint', async () => {
        const dto = { name: 'Updated' } as any;
        const result = await controller.update('1', dto);
        expect(result).toEqual({ id: '1', name: 'Updated' });
        expect(service.update).toHaveBeenCalledWith('1', dto);
    });

    it('should remove a blueprint', async () => {
        const result = await controller.remove('1');
        expect(result).toEqual({ success: true });
        expect(service.remove).toHaveBeenCalledWith('1');
    });
});
