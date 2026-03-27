import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Home,
  KeyRound,
  Mail,
  PlugZap,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
import { ManagedConnectorAdminList } from "@/src/components/admin/managed-connector-admin-list";
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
import { cn } from "@/src/lib/utils";

export const dynamic = "force-dynamic";

const sidebarLinkClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors";

function SidebarLink({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        sidebarLinkClassName,
        active
          ? "bg-[var(--color-bg-active)] text-white"
          : "text-[var(--color-text-base)] hover:bg-[var(--color-bg-active)] hover:text-white",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[var(--color-accent)]" : "text-[var(--color-text-base)]",
        )}
      />
      <span className="truncate font-medium">{label}</span>
    </Link>
  );
}

export default async function AddConnectorPage() {
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
  const oauthCallbackBaseUrl = getOAuthCallbackBaseUrl();
  const managedConnectors = canRegisterManagedConnectors
    ? await getContextLayerService().listManagedConnectors()
    : [];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <aside className="self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          <div className="space-y-4">
            <div className="border-b border-[var(--color-border)] pb-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
                OpenHands
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Context Layer</p>
                <Badge>
                  {canRegisterManagedConnectors
                    ? `${managedConnectors.length} registered`
                    : `${readyBuiltInConnectors.length} ready`}
                </Badge>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarLink href="/home" icon={Home} label="Home" />
              <SidebarLink href="/profile" icon={User} label="User Profile" />
              <SidebarLink href="/integrations" icon={PlugZap} label="Integrations" />
              <SidebarLink
                href="/agent-connection"
                icon={KeyRound}
                label="Agent Connection"
              />
            </nav>

            <div className="border-t border-[var(--color-border)] pt-3">
              <SidebarLink
                href="/add-connector"
                icon={ShieldCheck}
                label="Manage OAuth apps"
                active
              />
            </div>

            {session?.user ? (
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      Signed in as
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {session.user.name ?? "Context Layer Admin"}
                    </p>
                    <p className="mt-1 break-all text-xs text-[var(--color-text-base)]">
                      {session.user.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{readyBuiltInConnectors.length} ready</Badge>
                    <Badge>{providerCatalog.length} catalog</Badge>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
                OpenHands Context Layer
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                Manage OAuth apps
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
                Service-level connector administration now uses the same dashboard chrome as
                personal integrations, while keeping the underlying admin workflow the same.
                Review registered managed connectors, remove stale ones quickly, and
                register new OAuth or HTTP/MCP-backed providers for the whole deployment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{managedConnectors.length} registered</Badge>
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

          <div className="flex flex-wrap gap-2">
            {readyBuiltInConnectors.map((connector) => (
              <Badge key={connector.slug}>{connector.name}</Badge>
            ))}
          </div>

          <div className="grid gap-6">
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
                  The integration wizard only shows connectors that are ready to use in
                  this deployment. If you do not see the provider you need, please {adminInstruction}.
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
                  Share the provider name, the OAuth documentation link, the MCP server
                  URL or REST API/OpenAPI reference if you know it, and the work you want
                  the agent to do. That gives admins the context they need to register the
                  service-level connector.
                </p>
              </div>
            </Card>

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
                    add-connector catalog by default, update the source metadata in <code className="text-white">src/lib/integrations/oauth-provider-registration-defaults.ts</code>
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
          </div>

          {canRegisterManagedConnectors ? (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Registered managed connectors
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                    Edit stale service-level connector settings in place or delete a
                    connector before re-registering it with a new provider type.
                  </p>
                </div>
                <Badge>{managedConnectors.length} registered</Badge>
              </div>

              <ManagedConnectorAdminList initialManagedConnectors={managedConnectors} />
            </Card>
          ) : null}

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Popular official provider options
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                  Researched catalog of 50 popular providers with official API or MCP
                  entry points. Register one of these providers to make it show up in the
                  integrations wizard.
                </p>
              </div>
              <Badge>{providerCatalog.length} options</Badge>
            </div>

            <CuratedProviderList
              providerCatalog={providerCatalog}
              readyBuiltInConnectors={readyBuiltInConnectors}
              canRegisterManagedConnectors={canRegisterManagedConnectors}
              oauthCallbackBaseUrl={oauthCallbackBaseUrl}
            />
          </Card>
        </div>
      </div>
    </main>
  );
}
