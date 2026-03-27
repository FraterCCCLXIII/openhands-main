import Link from "next/link";
import { ArrowRight, DatabaseZap, KeyRound, ShieldCheck, Waypoints } from "lucide-react";

import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { isEphemeralContextLayerStorage } from "@/src/lib/persistence";
import { ServiceUnavailableScreen } from "@/src/components/service-unavailable-screen";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

export default async function HomePage() {
  const session = await auth();

  if (session?.user && isEphemeralContextLayerStorage()) {
    return (
      <ServiceUnavailableScreen
        isAdmin={isAppAdminEmail(session.user.email ?? undefined)}
      />
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-workspace)] px-8 py-10">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-base)]">
            <Badge>Vercel-native</Badge>
            <Badge>Managed + MCP adapters</Badge>
            <Badge>Scoped approvals</Badge>
          </div>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-bold tracking-tight text-white">
              OpenHands Context Layer
            </h1>
            <p className="text-lg leading-8 text-[var(--color-text-base)]">
              A unified endpoint and admin workspace for AI agents to access APIs and MCP tools with agent-class policies, temporary approvals, and Vercel-native persistence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={session?.user ? "/integrations" : "/signin"}>
              <Button className="gap-2">
                {session?.user ? "Open dashboard" : "Sign in to configure"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="/api/context/sample/mock" className="hidden" />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text-base)]">
              Unified route: <code>POST /api/context/[integration]/[function]</code>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Connector breadth",
              body: "Register managed connectors in the database, connect remote MCP servers directly, and still support broader Composio-based integrations.",
              icon: DatabaseZap,
            },
            {
              title: "MCP federation",
              body: "Connect remote MCP servers with the official TypeScript MCP SDK.",
              icon: Waypoints,
            },
            {
              title: "Fine-grained control",
              body: "Toggle entire integrations, individual functions, and agent-class scopes.",
              icon: ShieldCheck,
            },
            {
              title: "Human approval",
              body: "Route access requests to email, in-app, and SMS channels with expiring grants.",
              icon: KeyRound,
            },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <item.icon className="mb-4 h-8 w-8 text-[var(--color-accent)]" />
              <h2 className="mb-2 text-lg font-semibold text-white">{item.title}</h2>
              <p className="text-sm leading-7 text-[var(--color-text-base)]">{item.body}</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
