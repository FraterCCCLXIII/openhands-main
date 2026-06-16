import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { refreshGitHubAdminClaims } from "@/src/lib/auth-admin-claims";
import { getAuthSecret, getGithubClientId, getGithubClientSecret, isAuthDisabled } from "@/src/lib/auth-config";
import { mapGitHubProfile } from "@/src/lib/github-profile";

export { isAuthDisabled } from "@/src/lib/auth-config";

const mockSession = {
  user: {
    name: "Local Dev User",
    email: "dev@localhost",
    isAdmin: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const nextAuth = NextAuth({
  providers: [
    GitHub({
      clientId: getGithubClientId() || "dummy",
      clientSecret: getGithubClientSecret() || "dummy",
      authorization: { params: { scope: "read:user user:email" } },
      profile: mapGitHubProfile,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, account }) {
      return refreshGitHubAdminClaims(
        token,
        account?.provider === "github" ? account.access_token : undefined,
      );
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  secret: getAuthSecret() || undefined,
});

export const { handlers, signIn, signOut } = nextAuth;
export const auth = isAuthDisabled() ? async () => mockSession : nextAuth.auth;
