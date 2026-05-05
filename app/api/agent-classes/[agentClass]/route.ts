import { policyUpdateSchema } from "@/src/lib/core/schema";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ agentClass: string }> },
) {
  try {
    const payload = policyUpdateSchema.parse(await request.json());
    const { agentClass } = await params;
    const service = getIntegrationsHubService();
    return ok(await service.upsertAgentPolicy(agentClass, payload.rules));
  } catch (error) {
    return fromError(error);
  }
}
