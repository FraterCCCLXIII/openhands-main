import { ok } from "@/src/lib/api";
import { authenticateAdminApiRequest, fromAdminApiError } from "@/src/lib/admin-api-auth";
import { buildAdminOpenApiDocument } from "@/src/lib/admin-openapi";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);

    return ok(
      buildAdminOpenApiDocument({
        baseUrl: new URL(request.url).origin,
      }),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
