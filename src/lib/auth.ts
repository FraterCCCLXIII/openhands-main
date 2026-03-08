import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";

import {
  getAuthSecret,
  getGithubAuthSetupStatus,
  getGithubClientId,
  getGithubClientSecret,
  isAuthDisabled,
} from "@/src/lib/auth-config";

export { isAuthDisabled } from "@/src/lib/auth-config";

const mockSession = {
  user: {
    name: "Local Dev User",
    email: "dev@localhost",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const githubAuth = getGithubAuthSetupStatus();

const providers: Provider[] = githubAuth.configured
  ? [
      GitHub({
        clientId: getGithubClientId(),
        clientSecret: getGithubClientSecret(),
      }),
    ]
  : [];

const nextAuth = NextAuth({
  providers,
  pages: {
    signIn: "/signin",
  },
  secret: getAuthSecret() || undefined,
  trustHost: true,
});

export const { handlers, signIn, signOut } = nextAuth;
export const auth = isAuthDisabled() ? async () => mockSession : nextAuth.auth;
