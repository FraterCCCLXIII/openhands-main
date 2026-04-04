import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { AdminIntegrationsCatalog } from "@/src/components/admin/admin-integrations-catalog";
import { DashboardSidebar, DashboardSidebarUserPanel } from "@/src/components/admin/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/admin/dashboard-sign-out-button";
import { ServiceUnavailableScreen } from "@/src/components/service-unavailable-screen";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { getOAuthCallbackBaseUrl } from "@/src/lib/auth-config";
import { getContextLayerRepository, getContextLayerService } from "@/src/lib/core/runtime";
import { filterReadyBuiltInConnectors } from "@/src/lib/integrations/connector-readiness";
import { listBuiltInConnectors } from "@/src/lib/integrations/discovery";
import {
  getAdminContactEmail,
  getAdminContactInstruction,
} from "@/src/lib/integrations/connector-requests";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";
import { isEphemeralContextLayerStorage } from "@/src/lib/persistence";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  const session = await auth();

  if (session?.user && isEphemeralContextLayerStorage()) {
    return (
      <ServiceUnavailableScreen
        isAdmin={isAppAdminEmail(session.user.email ?? undefined)}
      />
    );
  }

  const adminEmail = getAdminContactEmail();
  const adminInstruction = getAdminContactInstruction(adminEmail ?? undefined);
  const repository = getContextLayerRepository();
  const readyBuiltInConnectors = filterReadyBuiltInConnectors(
    await listBuiltInConnectors(repository),
  );
  const providerCatalog = listOAuthProviderCatalog();
  const canRegisterManagedConnectors = isAppAdminEmail(session?.user?.email ?? undefined);
  const userName = session?.user?.name?.trim() || "Context Layer User";
  const userEmail = session?.user?.email?.trim() || "Not provided";
  const oauthCallbackBaseUrl = getOAuthCallbackBaseUrl();
  const managedConnectors = canRegisterManagedConnectors
    ? await getContextLayerService().listManagedConnectors()
    : [];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <DashboardSidebar
          badge={
            <Badge>
              {canRegisterManagedConnectors
                ? `${managedConnectors.length} registered`
                : `${readyBuiltInConnectors.length} ready`}
            </Badge>
          }
          activeItem="adminIntegrations"
          showAdminIntegrationsLink
          footer={
            session?.user ? (
              <DashboardSidebarUserPanel
                userName={userName}
                userEmail={userEmail}
                badges={[
                  <Badge key="ready">{readyBuiltInConnectors.length} ready</Badge>,
                  <Badge key="catalog">{providerCatalog.length} catalog</Badge>,
                ]}
                action={<DashboardSignOutButton />}
              />
            ) : undefined
          }
        />

        <div className="space-y-4">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
                OpenHands Context Layer
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Admin integrations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
                Service-level connector administration now uses the same dashboard
                chrome as personal integrations. Regular users can request missing
                providers, while admins can register, edit, and remove managed
                connectors for the deployment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canRegisterManagedConnectors ? (
                <Badge>{managedConnectors.length} registered</Badge>
              ) : null}
              <Badge>{readyBuiltInConnectors.length} ready now</Badge>
              <Badge>{providerCatalog.length} catalog options</Badge>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-base)]">
            <Link
              href={buildAdminSectionHref("integrations", {
                showIntegrationWizard: "1",
              })}
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to integrations
            </Link>
            <Badge>{readyBuiltInConnectors.length} connectors ready now</Badge>
          </div>

          {canRegisterManagedConnectors ? (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">For admins</h2>
                  <p className="text-sm text-[var(--color-text-base)]">
                    How to add a provider that is not currently showing up.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                <p>
                  Managing OAuth apps is a service-level admin action. Use this page to
                  register a managed connector so every user can see it in the integrations
                  wizard.
                </p>
                <p>
                  The in-app registration form is only available to signed-in app
                  administrators whose email appears in <code className="text-white">APP_ADMIN_EMAILS</code>, which should be set in Vercel environment variables.
                </p>
                <ol className="grid gap-3">
                  <li>
                    <span className="font-medium text-white">1.</span> Confirm the
                    provider has stable OAuth documentation and decide whether it should be
                    modeled as a remote MCP or as a managed HTTP connector generated from
                    an official OpenAPI schema. Collect the MCP server URL or API base
                    URL/OpenAPI URL, authorization URL, token URL, callback requirements,
                    and the minimum scopes the connector needs. Each provider row below now
                    starts with either an official vendor-hosted MCP URL or an official
                    REST API/OpenAPI default sourced from the provider&apos;s own docs.
                  </li>
                  <li>
                    <span className="font-medium text-white">2.</span> Create or update
                    the managed connector through the admin tooling below or by sending a
                    record to <code className="text-white">POST /api/managed-connectors</code>. Use the <a
                      href="/api/managed-connectors/openapi"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      endpoint schema doc
                    </a> for the request shape. If an old connector is stale, use the
                    registered connector panel below to edit it in place or delete it
                    before re-registering. If you want the provider to appear in the curated
                    admin-integrations catalog by default, update the source metadata in <code className="text-white">src/lib/integrations/oauth-provider-registration-defaults.ts</code>
                    and <code className="ml-1 text-white">src/lib/integrations/oauth-provider-catalog.ts</code>.
                  </li>
                  <li>
                    <span className="font-medium text-white">3.</span> Store any required
                    service-level credentials in that managed connector if this deployment
                    is going to run an OAuth callback flow for users. The integrations
                    wizard only lists OAuth connectors after those service-level
                    credentials are stored. Every provider row includes a direct link to
                    that provider&apos;s authentication setup docs and shows the callback URL
                    to register when OAuth is the preferred path. When <code className="text-white">AUTH_REDIRECT_PROXY_URL</code>
                    is configured for preview deployments, that callback uses the stable
                    deployment origin instead of the preview URL.
                  </li>
                  <li>
                    <span className="font-medium text-white">4.</span> Have a real user
                    open the integrations wizard, press <span className="text-white">Connect</span> and then <span className="text-white">Discover functions</span>. For
                    remote MCP connectors, that step loads the live tool list from the MCP
                    server. For managed HTTP/OpenAPI connectors, it loads the generated
                    function catalog stored on the managed connector.
                  </li>
                  <li>
                    <span className="font-medium text-white">5.</span> In the review step,
                    choose which discovered functions should be enabled, disabled, or
                    require approval by default.
                  </li>
                  <li>
                    <span className="font-medium text-white">6.</span> If the provider
                    needs custom behavior that cannot be expressed as a managed remote MCP
                    or managed HTTP connector, implement that custom adapter path
                    deliberately in the application and document why the managed connector
                    model is not enough before rolling it out.
                  </li>
                </ol>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
                  <UserRound className="h-4 w-4 text-[var(--color-accent)]" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">For users</h2>
                  <p className="text-sm text-[var(--color-text-base)]">
                    What to do when the connector you want is not listed.
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                <p>
                  The integration wizard only shows connectors that are ready to use in this
                  deployment. If you do not see the provider you need, please {adminInstruction}.
                </p>
                {adminEmail ? (
                  <a
                    href={`mailto:${adminEmail}`}
                    className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    <Mail className="h-4 w-4" />
                    Contact {adminEmail}
                  </a>
                ) : null}
                <p>
                  Share the provider name, the OAuth documentation link, the MCP server URL
                  or REST API/OpenAPI reference if you know it, and the work you want the
                  agent to do. That gives admins the context they need to register the
                  service-level connector.
                </p>
              </div>
            </Card>
          )}

          <AdminIntegrationsCatalog
            providerCatalog={providerCatalog}
            initialReadyBuiltInConnectors={readyBuiltInConnectors}
            managedConnectors={managedConnectors}
            canRegisterManagedConnectors={canRegisterManagedConnectors}
            oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          />
        </div>
      </div>
    </main>
  );
}
