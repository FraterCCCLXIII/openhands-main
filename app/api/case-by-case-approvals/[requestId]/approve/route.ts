import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

const approveSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const payload = approveSchema.parse(await request.json());
    const { requestId } = await params;
    const service = getContextLayerService();
    return ok(
      await service.approveOwnerAccessRequest(
        ownerId,
        requestId,
        ownerId,
        payload.durationMinutes,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
