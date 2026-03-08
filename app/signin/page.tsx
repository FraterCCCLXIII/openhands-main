"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [name, setName] = useState("Admin User");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-xl p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Sign in to Agent Context Layer</h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            Use Google in production or the dev login for local Vercel-style testing.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button className="w-full" onClick={() => signIn("google", { redirectTo: "/admin" })}>
            Continue with Google
          </Button>

          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-text-base)]">
                Email
                <input
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-text-base)]">
                Name
                <input
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <Button
                variant="secondary"
                onClick={() => signIn("credentials", { email, name, redirectTo: "/admin" })}
              >
                Use dev login
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
