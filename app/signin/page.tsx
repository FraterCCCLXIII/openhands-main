import Link from "next/link";

import { GitHubSignInButton } from "@/src/components/auth/github-sign-in-button";
import { Card } from "@/src/components/ui/card";
import { getGithubAuthSetupStatus } from "@/src/lib/auth-config";

const guideItems = [
  "Create a GitHub OAuth App in your GitHub account or organization settings.",
  "Set the homepage URL to your stable production site URL.",
  "Set the authorization callback URL to your stable production /api/auth/callback/github endpoint.",
  "Copy GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and AUTH_SECRET into your Vercel environment variables.",
  "Set AUTH_TRUST_HOST=true and, for preview deployments, AUTH_REDIRECT_PROXY_URL to your stable production /api/auth URL.",
];

export default function SignInPage() {
  const authSetup = getGithubAuthSetupStatus();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-xl p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Sign in to OpenHands Context Layer</h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            GitHub is the interactive sign-in option for the hosted app, matching the KPI tracker dashboard flow.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {authSetup.authDisabled ? (
            <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-active)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-base)]">
                Authentication is disabled in this environment. You can open the admin dashboard directly.
              </p>
              <Link
                href="/admin"
                className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-foreground)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Open admin dashboard
              </Link>
            </div>
          ) : authSetup.configured ? (
            <GitHubSignInButton callbackUrl="/admin" />
          ) : (
            <div className="space-y-5 rounded-xl border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] p-5 text-sm text-[var(--color-warning)]">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-white">GitHub sign-in is not configured yet</h2>
                <p className="leading-7 text-white/85">
                  Before GitHub login will work, finish the OAuth app setup below and redeploy.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-white">Missing configuration</p>
                <ul className="list-disc space-y-1 pl-5 text-white/85">
                  {authSetup.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-white">GitHub OAuth app checklist</p>
                <ol className="list-decimal space-y-1 pl-5 text-white/85">
                  {guideItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-xs text-white/85">
                <p>
                  <span className="font-semibold text-white">Current app URL:</span> {authSetup.baseUrl}
                </p>
                <p className="mt-2 break-all">
                  <span className="font-semibold text-white">GitHub callback URL:</span> {authSetup.callbackUrl}
                </p>
                {authSetup.previewDeploymentsEnabled ? (
                  <p className="mt-2 break-all">
                    <span className="font-semibold text-white">Preview redirect proxy:</span> {authSetup.redirectProxyUrl}
                  </p>
                ) : (
                  <p className="mt-2 text-[var(--color-warning)]">
                    Preview deployments are not enabled yet. Add AUTH_REDIRECT_PROXY_URL to match the KPI tracker setup.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
