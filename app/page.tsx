"use client";

import { useEffect } from "react";
import {
  ArrowRight,
  DatabaseZap,
  KeyRound,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { useAuth } from "@/src/components/auth/auth-context";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { Button } from "@/src/components/ui/button";
import {
  currentBrowserPath,
  redirectToMainAppLogin,
} from "@/src/lib/main-app-auth";
import { uiPath } from "@/src/shared/paths";

const LOGO_WIDTH = 92;
const LOGO_HEIGHT = 60;

const features = [
  {
    title: "Connector breadth",
    body: "Register managed connectors in the database and connect remote MCP servers directly without a separate integration layer.",
    icon: DatabaseZap,
  },
  {
    title: "MCP federation",
    body: "Connect remote MCP servers with the official TypeScript MCP SDK.",
    icon: Waypoints,
  },
  {
    title: "Fine-grained control",
    body: "Toggle entire integrations, individual tools, and agent-class scopes.",
    icon: ShieldCheck,
  },
  {
    title: "Human approval",
    body: "Route access requests to email, in-app, and SMS channels with expiring grants.",
    icon: KeyRound,
  },
];

export default function HomePage() {
  const { isAuthenticated, isLoading, authDisabled, sessionError } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !authDisabled && !sessionError) {
      redirectToMainAppLogin(currentBrowserPath());
    }
  }, [authDisabled, isAuthenticated, isLoading, sessionError]);

  if (isLoading || (!isAuthenticated && !authDisabled && !sessionError)) {
    return <LoadingSpinner label="Redirecting to OpenHands sign-in..." />;
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <img
            src="/openhands-logo.svg"
            alt=""
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            className="mb-8"
          />

          <h1 className="text-3xl font-medium leading-9 tracking-[-0.02em] text-white">
            OpenHands Integrations Hub
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
            A unified endpoint and admin workspace for AI agents to access APIs and MCP tools with
            agent-class policies, temporary approvals, and persistent integration storage.
          </p>

          {isAuthenticated || authDisabled ? (
            <a href={uiPath("/integrations")} className="mt-6">
              <Button className="gap-2">
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </a>
          ) : null}

          <div className="mt-6 w-fit rounded-xl border border-[var(--oh-border)] bg-base-secondary px-4 py-3 text-sm text-text-secondary">
            Unified route:{" "}
            <code className="text-foreground">POST /api/context/[integration]/[function]</code>
          </div>

          <section className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div key={item.title} className="p-3 text-left">
                <item.icon className="mb-2 h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-sm font-medium text-white">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-text-secondary">{item.body}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
