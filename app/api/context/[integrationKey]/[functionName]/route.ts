import { contextInvokeSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string; functionName: string }> },
) {
  try {
    const payload = contextInvokeSchema.parse(await request.json());
    const { integrationKey, functionName } = await params;
    const service = getContextLayerService();
    return ok(
      await service.invokeContext(
        payload.agentId,
        payload.agentClass,
        integrationKey,
        functionName,
        payload.payload,
        payload.scopes,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
