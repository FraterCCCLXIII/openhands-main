import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { filterReadyBuiltInConnectors } from "@/src/lib/integrations/connector-readiness";
import {
  getAdminContactEmail,
  getAdminContactInstruction,
} from "@/src/lib/integrations/connector-requests";
import { listBuiltInConnectors } from "@/src/lib/integrations/built-in-connectors";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

export const dynamic = "force-dynamic";

export default async function AddConnectorPage() {
  const session = await auth();
  const adminEmail = getAdminContactEmail();
  const adminInstruction = getAdminContactInstruction(adminEmail ?? undefined);
  const readyBuiltInConnectors = filterReadyBuiltInConnectors(listBuiltInConnectors());
  const providerCatalog = listOAuthProviderCatalog();
  const canRegisterManagedConnectors = isAppAdminEmail(session?.user?.email ?? undefined);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-base)]">
          <a
            href="/admin?section=integrations&showIntegrationWizard=1"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to integrations
          </a>
          <Badge>{readyBuiltInConnectors.length} connectors ready now</Badge>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white">
            Add a connector
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
            If the integration setup flow does not show the provider you need,
            use this page to see what is already available and learn how admins
            can register a missing OAuth-backed MCP for the whole service, or
            fall back to source-code changes for special-case implementations.
          </p>
          <div className="flex flex-wrap gap-2">
            {readyBuiltInConnectors.map((connector) => (
              <Badge key={connector.slug}>{connector.name}</Badge>
            ))}
          </div>
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
                The integration wizard only shows connectors that are ready to use
                in this deployment. If you do not see the provider you need,
                please {adminInstruction}.
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
                Share the provider name, the OAuth documentation link, the MCP
                server URL if you know it, and the work you want the agent to do.
                That gives admins the context they need to register the service-level connector.
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
                Add connector is a service-level admin action. Use it once to
                register an OAuth-backed MCP so every user can see it in the
                integrations wizard.
              </p>
              <p>
                The in-app registration form is only available to signed-in app
                administrators whose email appears in <code className="text-white">APP_ADMIN_EMAILS</code>, which should be set in Vercel environment variables.
              </p>
              <ol className="grid gap-3">
                <li>
                  <span className="font-medium text-white">1.</span> Confirm the
                  provider has stable OAuth documentation and identify the MCP
                  server URL, authorization URL, token URL, callback requirements,
                  and the minimum scopes the MCP needs.
                </li>
                <li>
                  <span className="font-medium text-white">2.</span> Create or
                  update the managed connector through the admin tooling or by
                  sending a record to <code className="text-white">POST /api/managed-connectors</code>. Use the{" "}
                  <a
                    href="/api/managed-connectors/openapi"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    endpoint schema doc
                  </a>{" "}
                  for the request shape.
                </li>
                <li>
                  <span className="font-medium text-white">3.</span> Store the
                  OAuth client ID and client secret in that managed connector if
                  this service is going to run the OAuth callback flow for users.
                </li>
                <li>
                  <span className="font-medium text-white">4.</span> Have a real
                  user open the integrations wizard, press <span className="text-white">Connect</span> and then <span className="text-white">Discover functions</span>. That step adds the full MCP tool list to their personal integration.
                </li>
                <li>
                  <span className="font-medium text-white">5.</span> In the
                  review step, choose which discovered functions should be enabled,
                  disabled, or require approval by default.
                </li>
                <li>
                  <span className="font-medium text-white">6.</span> If the
                  provider needs custom behavior beyond a remote OAuth MCP,
                  modify <code className="text-white">src/lib/integrations/built-in-connectors.ts</code>
                  {" "}and add or update the corresponding <code className="text-white">app/api/mcp/&lt;provider&gt;/route.ts</code> implementation.
                </li>
              </ol>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Popular OAuth-ready provider options
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                Researched catalog of 50 popular providers with OAuth support.
                The curated built-ins above work now; the rest are planned next.
              </p>
            </div>
            <Badge>{providerCatalog.length} options</Badge>
          </div>

          <CuratedProviderList
            providerCatalog={providerCatalog}
            readyBuiltInConnectors={readyBuiltInConnectors}
            canRegisterManagedConnectors={canRegisterManagedConnectors}
          />
        </Card>
      </div>
    </main>
  );
}
