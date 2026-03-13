import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { ServiceUnavailableScreen } from "@/src/components/service-unavailable-screen";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth, isAuthDisabled } from "@/src/lib/auth";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { isEphemeralContextLayerStorage } from "@/src/lib/persistence";
import { getRequestOrigin } from "@/src/lib/request-context";

export async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    redirect("/signin");
  }

  if (isEphemeralContextLayerStorage()) {
    return (
      <ServiceUnavailableScreen
        isAdmin={isAppAdminEmail(session?.user?.email ?? undefined)}
      />
    );
  }

  const { user: currentUser, ownerId: contextApiOwner } =
    await getCurrentUserIdentity();
  const isAdmin = isAppAdminEmail(currentUser.email ?? undefined);
  const requestHeaders = await headers();
  const service = getContextLayerService();
  const [initialIntegrations, initialAccessRequests, initialNotifications, contextApiAuth] =
    await Promise.all([
      service.listOwnerIntegrations(contextApiOwner),
      service.listAccessRequests(),
      service.listNotifications(),
      service.getOrCreateAgentApiKey(contextApiOwner),
    ]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard
          currentUser={currentUser}
          initialIntegrations={initialIntegrations}
          initialAccessRequests={initialAccessRequests}
          initialNotifications={initialNotifications}
          contextApiBaseUrl={getRequestOrigin(requestHeaders)}
          contextApiKey={contextApiAuth.apiKey}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
