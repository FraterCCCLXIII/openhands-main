import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardWorkspace } from "@/src/components/dashboard/workspace";
import { ServiceUnavailableScreen } from "@/src/components/feedback/service-unavailable-screen";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth, isAuthDisabled } from "@/src/lib/auth";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { isEphemeralIntegrationsHubStorage } from "@/src/lib/persistence";
import { getRequestOrigin } from "@/src/lib/request-context";

/**
 * Server-side dashboard page that pre-fetches data on the server.
 * This is used when SSR mode is enabled (default Next.js behavior).
 */
export async function ServerDashboardPage() {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    redirect("/signin");
  }

  if (isEphemeralIntegrationsHubStorage()) {
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
  const service = getIntegrationsHubService();
  const [
    initialIntegrations,
    initialAccessRequests,
    contextApiAuth,
    existingUserApiKey,
    existingAdminApiKey,
  ] = await Promise.all([
    service.listOwnerIntegrationsWithUsage(contextApiOwner),
    service.listOwnerAccessRequests(contextApiOwner),
    service.getOrCreateAgentApiKey(contextApiOwner),
    service.getUserApiKeyStatus(contextApiOwner),
    isAdmin ? service.getAdminApiKeyStatus(contextApiOwner) : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <DashboardWorkspace
          currentUser={currentUser}
          initialIntegrations={initialIntegrations}
          initialAccessRequests={initialAccessRequests}
          contextApiBaseUrl={getRequestOrigin(requestHeaders)}
          contextApiKey={contextApiAuth.apiKey}
          userApiKey={existingUserApiKey}
          adminApiKey={existingAdminApiKey}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
