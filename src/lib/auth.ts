import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";

import { getAuthSecret, getGoogleAuthSetupStatus, isAuthDisabled } from "@/src/lib/auth-config";

export { isAuthDisabled } from "@/src/lib/auth-config";

const mockSession = {
  user: {
    name: "Local Dev User",
    email: "dev@localhost",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const googleAuth = getGoogleAuthSetupStatus();

const providers: Provider[] = googleAuth.configured
  ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
