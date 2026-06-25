"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/components/auth/auth-context";
import { CloudDeviceFlowButton } from "@/src/components/auth/cloud-device-flow-button";
import { Card } from "@/src/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const {
    authDisabled,
    isAuthenticated,
    isLoading,
    signInWithOpenHandsToken,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/integrations");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-base)]">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-xl p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Sign in to OpenHands Integrations Hub
          </h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            Use your OpenHands Cloud account to manage integrations and API keys.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {authDisabled ? (
            <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-active)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-base)]">
                Authentication is disabled in this environment. You can open the
                dashboard directly.
              </p>
              <Link
                href="/integrations"
                className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-foreground)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Open dashboard
              </Link>
            </div>
          ) : (
            <CloudDeviceFlowButton
              onToken={(token) => {
                signInWithOpenHandsToken(token);
                router.push("/integrations");
              }}
            />
          )}
        </div>
      </Card>
    </main>
  );
}
