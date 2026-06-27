import { redirect } from "next/navigation";

// Legacy entry point. New links and redirects target /integrations directly
// (see src/lib/admin-routes.ts). Kept so old bookmarks and references don't 404.
// Using next/navigation redirect works in both SSR and static-export (SPA) builds.
export default function LegacyHomePage() {
  redirect("/integrations");
}
