import { z } from "zod";

import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

const approveRequestSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const identity = await authenticateAdminApiRequest(request);
    const payload = approveRequestSchema.parse(await request.json().catch(() => ({})));
    const service = getContextLayerService();
    const { requestId } = await params;

    return ok(
      await service.approveAccessRequest(
        requestId,
        identity.email,
        payload.durationMinutes,
      ),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
