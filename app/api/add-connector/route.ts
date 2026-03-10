import { fromError, ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  buildConnectorRequestNotification,
  connectorRequestCreateSchema,
  getAdminContactInstruction,
} from "@/src/lib/integrations/connector-requests";

export async function POST(request: Request) {
  try {
    const payload = connectorRequestCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    const notification = await service.createNotification(
      buildConnectorRequestNotification(payload),
    );

    return ok(
      {
        detail: `Connector request submitted. Next step: ${getAdminContactInstruction()}.`,
        notification,
      },
      { status: 201 },
    );
  } catch (error) {
    return fromError(error);
  }
}
