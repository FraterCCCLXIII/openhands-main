import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { getAuthSecret, getGithubClientId, getGithubClientSecret, isAuthDisabled } from "@/src/lib/auth-config";

export { isAuthDisabled } from "@/src/lib/auth-config";

const mockSession = {
  user: {
    name: "Local Dev User",
    email: "dev@localhost",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const nextAuth = NextAuth({
  providers: [
    GitHub({
      clientId: getGithubClientId() || "dummy",
      clientSecret: getGithubClientSecret() || "dummy",
      authorization: { params: { scope: "read:user" } },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  secret: getAuthSecret() || undefined,
});

export const { handlers, signIn, signOut } = nextAuth;
export const auth = isAuthDisabled() ? async () => mockSession : nextAuth.auth;
