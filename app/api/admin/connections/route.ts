import { z } from "zod";

import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";

const adminConnectionsQuerySchema = z.object({
  ownerId: z.string().optional(),
  provider: z.string().optional(),
  integrationKey: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    const service = getIntegrationsHubService();
    const filters = adminConnectionsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    return ok(
      await service.listAdminIntegrationConnections({
        ownerId: filters.ownerId,
        provider: filters.provider,
        integrationKey: filters.integrationKey,
        query: filters.q,
        limit: filters.limit,
        offset: filters.offset,
      }),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
