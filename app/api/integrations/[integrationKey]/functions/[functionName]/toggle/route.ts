import { z } from "zod";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

const toggleSchema = z.object({ enabled: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string; functionName: string }> },
) {
  try {
    const payload = toggleSchema.parse(await request.json());
    const { integrationKey, functionName } = await params;
    const service = getContextLayerService();
    return ok(await service.setFunctionEnabled(integrationKey, functionName, payload.enabled));
  } catch (error) {
    return fromError(error);
  }
}
