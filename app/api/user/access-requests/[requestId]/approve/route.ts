import { z } from "zod";

import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

const approveSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request, {
      requireAdmin: true,
    });
    const payload = approveSchema.parse(await request.json());
    const { requestId } = await params;
    const service = getContextLayerService();

    return ok(
      await service.approveAccessRequest(
        requestId,
        ownerId,
        payload.durationMinutes,
      ),
    );
  } catch (error) {
    return fromUserApiError(error);
  }
}
