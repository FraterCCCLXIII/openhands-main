import { Suspense } from "react";

import { ClientAdminIntegrationsPage } from "@/src/components/admin/integrations/client-page";

export default function AdminIntegrationsPage() {
  return (
    <Suspense>
      <ClientAdminIntegrationsPage />
    </Suspense>
  );
}
