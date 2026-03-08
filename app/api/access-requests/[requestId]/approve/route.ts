import { accessRequestDecisionSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const payload = accessRequestDecisionSchema.parse(await request.json());
    const { requestId } = await params;
    const service = getContextLayerService();
    return ok(
      await service.approveAccessRequest(
        requestId,
        payload.approver,
        payload.durationMinutes,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
