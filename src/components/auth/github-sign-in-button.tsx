"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/src/components/ui/button";

type GitHubSignInButtonProps = {
  callbackUrl?: string;
};

export function GitHubSignInButton({ callbackUrl = "/integrations" }: GitHubSignInButtonProps) {
  return (
    <Button className="w-full" onClick={() => signIn("github", { callbackUrl })}>
      Continue with GitHub
    </Button>
  );
}
