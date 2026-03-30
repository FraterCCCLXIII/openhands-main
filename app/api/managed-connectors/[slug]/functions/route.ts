import { fromError, ok } from "@/src/lib/api";
import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!isAppAdminEmail(session?.user?.email ?? undefined)) {
      throw new ContextLayerError("Only app administrators can manage connector tools.", 403);
    }

    const { slug } = await params;
    return ok(
      await getContextLayerService().indexManagedConnectorFunctions(
        slug,
        session?.user?.email ?? undefined,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
