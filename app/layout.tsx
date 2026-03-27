import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/src/components/providers";

export const metadata: Metadata = {
  title: "OpenHands Context Layer",
  description:
    "A context layer for AI agents with managed connectors, MCP, approvals, and scoped permissions.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
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
