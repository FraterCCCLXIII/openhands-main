import { AlertTriangle, DatabaseZap } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";

type ServiceUnavailableScreenProps = {
  isAdmin: boolean;
};

export const ServiceUnavailableScreen = ({
  isAdmin,
}: ServiceUnavailableScreenProps) => (
  <main className="min-h-screen px-6 py-12">
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-workspace)] px-8 py-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-base)]">
          <Badge>Service unavailable</Badge>
          {isAdmin ? <Badge>Admin action required</Badge> : null}
        </div>
        <div className="mt-6 max-w-2xl space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
            <AlertTriangle className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Service unavailable
          </h1>
          <p className="text-base leading-8 text-[var(--color-text-base)]">
            {isAdmin
              ? "This deployment cannot load the context layer because persistent Postgres storage is not configured."
              : "The context layer is temporarily unavailable. Please contact your administrator and try again later."}
          </p>
        </div>
      </header>

      {isAdmin ? (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
              <DatabaseZap className="h-4 w-4 text-[var(--color-accent)]" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">How to set up the database</h2>
              <p className="text-sm text-[var(--color-text-base)]">
                Configure persistent Postgres storage for this deployment, then redeploy.
              </p>
            </div>
          </div>
          <ol className="grid gap-3 text-sm leading-7 text-[var(--color-text-base)]">
            <li>
              <span className="font-medium text-white">1.</span> Provision a Postgres database for this environment.
            </li>
            <li>
              <span className="font-medium text-white">2.</span> Add either <code className="text-white">POSTGRES_URL</code> or <code className="text-white">DATABASE_URL</code> in the deployment environment settings.
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
