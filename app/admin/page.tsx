import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { auth, isAuthDisabled } from "@/src/lib/auth";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { getRequestOrigin } from "@/src/lib/request-context";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    redirect("/signin");
  }

  const currentUser = session?.user ?? {
    name: "Admin User",
    email: "dev@localhost",
  };
  const requestHeaders = await headers();
  const service = getContextLayerService();
  const contextApiOwner =
    currentUser.email?.trim() || currentUser.name?.trim() || "dev@localhost";
  const [initialIntegrations, initialAccessRequests, initialNotifications, contextApiAuth] =
    await Promise.all([
      service.listIntegrations(),
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
        />
      </div>
    </main>
  );
}
