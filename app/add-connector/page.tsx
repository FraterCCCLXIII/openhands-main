import { ArrowLeft, ExternalLink, Mail, ShieldCheck, UserRound } from "lucide-react";

import { AddConnectorRequestForm } from "@/src/components/add-connector/add-connector-request-form";
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

const availabilityTone = (availability: "oauth_ready" | "manual_token" | "planned") => {
  switch (availability) {
    case "oauth_ready":
      return "success" as const;
    case "planned":
      return "warning" as const;
    default:
      return "default" as const;
  }
};

const availabilityLabel = (availability: "oauth_ready" | "manual_token" | "planned") => {
  switch (availability) {
    case "oauth_ready":
      return "OAuth ready";
    case "manual_token":
      return "Manual token today";
    case "planned":
      return "Planned";
  }
};

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
            use this page to see what is already available, understand how OAuth
            setup works, and submit the provider details needed for the next
            connector request.
          </p>
          <div className="flex flex-wrap gap-2">
            {readyBuiltInConnectors.map((connector) => (
              <Badge key={connector.slug}>{connector.name}</Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
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
                work you want the agent to do. That helps admins determine whether
                a built-in connector or MCP route should be added next.
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
                  Step-by-step guidance for onboarding a new OAuth provider.
                </p>
              </div>
            </div>

            <ol className="grid gap-3 text-sm leading-7 text-[var(--color-text-base)]">
              <li>
                <span className="font-medium text-white">1.</span> Confirm the
                provider has stable OAuth documentation and identify the app URL,
                authorization URL, token URL, callback requirements, and minimum
                scopes.
              </li>
              <li>
                <span className="font-medium text-white">2.</span> Register an
                OAuth app with the provider and add the client ID and client
                secret to the deployment environment before redeploying.
              </li>
              <li>
                <span className="font-medium text-white">3.</span> Add or update
                the built-in connector metadata, provider-specific OAuth handling,
                and MCP proxy route so discovery and invocation can use the saved
                per-user token.
              </li>
              <li>
                <span className="font-medium text-white">4.</span> Open the admin
                dashboard, connect a real user account, and confirm the connector
                appears in the setup wizard as a ready-to-use option.
              </li>
            </ol>

            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white">
                  Submit provider information
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                  Use this form to capture the provider details, OAuth endpoints,
                  scopes, and business need so the next connector implementation
                  has the right setup context.
                </p>
              </div>
              <AddConnectorRequestForm adminEmail={adminEmail} />
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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {providerCatalog.map((provider) => {
              const builtInMatch = provider.builtInSlug
                ? readyBuiltInConnectors.find(
                    (connector) => connector.slug === provider.builtInSlug,
                  )
                : null;

              return (
                <div
                  key={provider.slug}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{provider.name}</p>
                    <Badge>{provider.slug}</Badge>
                    <Badge tone={availabilityTone(provider.availability)}>
                      {availabilityLabel(provider.availability)}
                    </Badge>
                    {builtInMatch ? <Badge tone="success">Ready now</Badge> : null}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-base)]">
                    {provider.description}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                    {provider.notes}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.categories.map((category) => (
                      <Badge key={`${provider.slug}-${category}`}>{category}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {builtInMatch ? (
                      <a
                        href={`/admin?section=integrations&showIntegrationWizard=1&builtIn=${builtInMatch.slug}`}
                        className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Use {builtInMatch.name}
                      </a>
                    ) : null}
                    {provider.docsUrl ? (
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        OAuth docs
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
