import { z } from "zod";

import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";

const updateToolSchema = z.object({
  accessMode: z.enum(["enabled", "disabled", "approval_required"]),
});

const DEPRECATED_ADMIN_TOOL_ACCESS_MESSAGE =
  "Admin API keys can no longer update self-scoped tool access. Use the user API key with /api/user/integrations/{integrationKey}/tools/{toolName} instead.";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ integrationKey: string; toolName: string }> },
) {
  try {
    await authenticateAdminApiRequest(request);
    updateToolSchema.parse(await request.json());
    await params;
    throw new ContextLayerError(DEPRECATED_ADMIN_TOOL_ACCESS_MESSAGE, 410);
  } catch (error) {
    return fromAdminApiError(error);
  }
}
