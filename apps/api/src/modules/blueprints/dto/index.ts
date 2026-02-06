import { z } from 'zod';
import { BlueprintSchema } from '../schemas/blueprint.schema';

export const CreateBlueprintDto = BlueprintSchema;
export const UpdateBlueprintDto = BlueprintSchema.partial();

export type CreateBlueprintDto = z.infer<typeof CreateBlueprintDto>;
export type UpdateBlueprintDto = z.infer<typeof UpdateBlueprintDto>;
