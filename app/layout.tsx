import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/src/components/providers";

export const metadata: Metadata = {
  title: "OpenHands Context Layer",
  description:
    "A Vercel-native context layer for AI agents with managed connectors, MCP, approvals, and scoped permissions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
