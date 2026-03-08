import { functionCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string }> },
) {
  try {
    const payload = functionCreateSchema.parse(await request.json());
    const { integrationKey } = await params;
    const service = getContextLayerService();
    return ok(await service.addFunction(integrationKey, payload));
  } catch (error) {
    return fromError(error);
  }
}
