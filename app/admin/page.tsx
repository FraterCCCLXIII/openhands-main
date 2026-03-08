import { redirect } from "next/navigation";

import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { auth, isAuthDisabled } from "@/src/lib/auth";
import { getContextLayerService } from "@/src/lib/core/runtime";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    redirect("/signin");
  }

  const service = getContextLayerService();
  const [initialIntegrations, initialAccessRequests, initialNotifications] =
    await Promise.all([
      service.listIntegrations(),
      service.listAccessRequests(),
      service.listNotifications(),
    ]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard
          currentUser={session?.user ?? { name: "Admin User", email: "dev@localhost" }}
          initialIntegrations={initialIntegrations}
          initialAccessRequests={initialAccessRequests}
          initialNotifications={initialNotifications}
        />
      </div>
    </main>
  );
}
