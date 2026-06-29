import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";

type ServiceUnavailableScreenProps = {
  isAdmin: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export const ServiceUnavailableScreen = ({
  isAdmin,
  onRetry,
  isRetrying = false,
}: ServiceUnavailableScreenProps) => (
  <main className="min-h-screen px-6 py-12">
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="rounded-xl border border-[var(--oh-border)] bg-[var(--oh-bg-workspace)] px-8 py-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--oh-text-secondary)]">
          <Badge>Service unavailable</Badge>
          {isAdmin ? <Badge>Admin action required</Badge> : null}
        </div>
        <div className="mt-6 max-w-2xl space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)]">
            <AlertTriangle className="h-6 w-6 text-[var(--oh-accent)]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Service unavailable
          </h1>
          <p className="text-base leading-8 text-[var(--oh-text-secondary)]">
            {isAdmin
              ? "This deployment cannot load the integrations hub because persistent Postgres storage is not configured."
              : "The integrations hub is temporarily unavailable. Please contact your administrator and try again later."}
          </p>
        </div>
        {onRetry ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              {isRetrying ? "Retrying..." : "Try again"}
            </button>
          </div>
        ) : null}
      </header>

      {isAdmin ? (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] p-2">
              <DatabaseZap className="h-4 w-4 text-[var(--oh-accent)]" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">How to set up the database</h2>
              <p className="text-sm text-[var(--oh-text-secondary)]">
                Configure persistent Postgres storage for this deployment, then redeploy.
              </p>
            </div>
          </div>
          <ol className="grid gap-3 text-sm leading-5 text-[var(--oh-text-secondary)]">
            <li>
              <span className="font-medium text-white">1.</span> Provision a Postgres database for this environment.
            </li>
            <li>
              <span className="font-medium text-white">2.</span> Add <code className="text-white">INTHUB_POSTGRES_URL</code> in the deployment environment settings.
            </li>
            <li>
              <span className="font-medium text-white">3.</span> Redeploy the application so the server starts with the database connection available.
            </li>
            <li>
              <span className="font-medium text-white">4.</span> Reopen the admin dashboard and register connectors again after the database is live.
            </li>
          </ol>
        </Card>
      ) : null}
    </div>
  </main>
);
