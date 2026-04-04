import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyAddConnectorPage() {
  redirect("/integrations?showIntegrationWizard=1");
}
