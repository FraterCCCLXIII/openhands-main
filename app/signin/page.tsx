import Link from "next/link";

import { Card } from "@/src/components/ui/card";
import { getGoogleAuthSetupStatus } from "@/src/lib/auth-config";

const guideItems = [
  "Create a Google Cloud OAuth client of type Web application.",
  "Set the app's authorized JavaScript origin to your site URL.",
  "Set the app's authorized redirect URI to /api/auth/callback/google on that same site.",
  "Copy the client ID and client secret into your Vercel environment variables.",
  "Set NEXTAUTH_SECRET (or AUTH_SECRET) and NEXTAUTH_URL, then redeploy.",
];

export default function SignInPage() {
  const authSetup = getGoogleAuthSetupStatus();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-xl p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Sign in to Agent Context Layer</h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            Google is the only interactive sign-in option for the hosted app.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {authSetup.authDisabled ? (
            <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-active)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-base)]">
                Authentication is disabled in this environment. You can open the admin dashboard directly.
              </p>
              <Link
                href="/admin"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Open admin dashboard
              </Link>
            </div>
          ) : authSetup.configured ? (
            <a
              href="/api/auth/signin/google?callbackUrl=%2Fadmin"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Continue with Google
            </a>
          ) : (
            <div className="space-y-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-white">Google sign-in is not configured yet</h2>
                <p className="leading-7 text-amber-50/90">
                  Before Google login will work, finish the OAuth setup below and redeploy.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-white">Missing configuration</p>
                <ul className="list-disc space-y-1 pl-5 text-amber-50/90">
                  {authSetup.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-white">Google Cloud Console checklist</p>
                <ol className="list-decimal space-y-1 pl-5 text-amber-50/90">
                  {guideItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-xs text-amber-50/90">
                <p><span className="font-semibold text-white">Base URL:</span> {authSetup.baseUrl}</p>
                <p className="mt-2 break-all"><span className="font-semibold text-white">Redirect URI:</span> {authSetup.callbackUrl}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
