import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const isAuthDisabled = process.env.DISABLE_AUTH === "true";

const mockSession = {
  user: {
    name: "Local Dev User",
    email: "dev@localhost",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const providers: Provider[] = [
  Credentials({
    name: "Dev login",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Name", type: "text" },
    },
    authorize(credentials) {
      const email = credentials?.email;
      const name = credentials?.name;

      if (typeof email !== "string" || typeof name !== "string") {
        return null;
      }

      return {
        id: email,
        email,
        name,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

const nextAuth = NextAuth({
  providers,
  pages: {
    signIn: "/signin",
  },
});

export const { handlers, signIn, signOut } = nextAuth;
export const auth = isAuthDisabled ? async () => mockSession : nextAuth.auth;
