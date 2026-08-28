import { redirect } from "next/navigation";

// Legacy entry point. Permission profiles now live on /agent-connection.
export default function LegacyPermissionProfilesPage() {
  redirect("/agent-connection");
}
