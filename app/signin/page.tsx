"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/components/auth/auth-context";
import { GitHubSignInButton } from "@/src/components/auth/github-sign-in-button";
import { Card } from "@/src/components/ui/card";

const guideItems = [
  "Create a GitHub OAuth App in your GitHub account or organization settings.",
  "Set the homepage URL to your stable production site URL.",
  "Set the authorization callback URL to your stable production /api/auth/callback/github endpoint.",
  "Configure GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and AUTH_SECRET as environment variables for your deployment.",
  "Set AUTH_TRUST_HOST=true and, for preview deployments, AUTH_REDIRECT_PROXY_URL to your stable production /api/auth URL.",
];

export default function SignInPage() {
  const router = useRouter();
  const { authDisabled, isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/integrations");
    }
  }, [isLoading, isAuthenticated, router]);

  // Compute current URL info client-side
  const urlInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return { baseUrl: "", callbackUrl: "" };
    }
    const baseUrl = window.location.origin;
    return {
      baseUrl,
      callbackUrl: `${baseUrl}/api/auth/callback/github`,
    };
  }, []);

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
          <h1 className="text-3xl font-bold text-white">Sign in to OpenHands Integrations Hub</h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            GitHub is the interactive sign-in option for the hosted app, matching the KPI tracker dashboard flow.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {authDisabled ? (
            <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-active)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-base)]">
                Authentication is disabled in this environment. You can open the admin dashboard directly.
              </p>
              <Link
                href="/integrations"
                className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-foreground)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Open admin dashboard
              </Link>
            </div>
          ) : (
            <>
              <GitHubSignInButton callbackUrl="/integrations" />

              <div className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm text-[var(--color-text-base)]">
                <div className="space-y-2">
                  <p className="font-medium text-white">GitHub OAuth app checklist</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    {guideItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4 text-xs">
                  <p>
                    <span className="font-semibold text-white">Current app URL:</span> {urlInfo.baseUrl}
                  </p>
                  <p className="mt-2 break-all">
                    <span className="font-semibold text-white">GitHub callback URL:</span> {urlInfo.callbackUrl}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}
