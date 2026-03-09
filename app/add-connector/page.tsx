import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { filterReadyBuiltInConnectors } from "@/src/lib/integrations/connector-readiness";
import {
  getAdminContactEmail,
  getAdminContactInstruction,
} from "@/src/lib/integrations/connector-requests";
import { listBuiltInConnectors } from "@/src/lib/integrations/built-in-connectors";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

export const dynamic = "force-dynamic";

export default function AddConnectorPage() {
  const adminEmail = getAdminContactEmail();
  const adminInstruction = getAdminContactInstruction(adminEmail ?? undefined);
  const readyBuiltInConnectors = filterReadyBuiltInConnectors(listBuiltInConnectors());
  const providerCatalog = listOAuthProviderCatalog();

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
            can add a missing provider through the managed-connector system for
            common OAuth and HTTP patterns, or through source-code changes for
            special-case implementations.
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
                Share the provider name, the OAuth documentation link, and the
                work you want the agent to do. That gives admins the context they
                need to add the connector as a managed integration record.
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
                For most providers, add a managed connector record in the
                database instead of making source-code changes.
              </p>
              <ol className="grid gap-3">
                <li>
                  <span className="font-medium text-white">1.</span> Confirm the
                  provider has stable OAuth documentation and identify the app
                  URL, authorization URL, token URL, callback requirements,
                  minimum scopes, and the core REST operations you want agents to
                  call.
                </li>
                <li>
                  <span className="font-medium text-white">2.</span> Create or
                  update a managed connector through the admin tooling or by
                  sending a record to <code className="text-white">POST /api/managed-connectors</code>. Use the{" "}
                  <a
                    href="/api/managed-connectors/openapi"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    OpenAPI doc
                  </a>{" "}
                  for the request shape.
                </li>
                <li>
                  <span className="font-medium text-white">3.</span> In that DB
                  record, fill in the provider metadata, base API URL, auth
                  strategy, OAuth settings, and the function request templates the
                  generic connector should expose.
                </li>
                <li>
                  <span className="font-medium text-white">4.</span> If the
                  provider uses OAuth, store the client ID and client secret in
                  the managed connector record so the runtime can complete the
                  OAuth flow without any code deploy.
                </li>
                <li>
                  <span className="font-medium text-white">5.</span> Open the
                  admin dashboard, connect a real user account, and confirm the
                  connector now appears in the integration wizard as a ready
                  option.
                </li>
                <li>
                  <span className="font-medium text-white">6.</span> Only fall
                  back to a custom code change when the provider needs behavior
                  the managed connector model cannot express yet.
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
          />
        </Card>
      </div>
    </main>
  );
}
