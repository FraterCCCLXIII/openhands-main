import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/src/components/providers";
import { uiPath } from "@/src/shared/paths";

export const metadata: Metadata = {
  title: "OpenHands Integrations Hub",
  description:
    "A integrations hub for AI agents with managed connectors, MCP, approvals, and scoped permissions.",
  icons: {
    icon: [{ url: uiPath("/favicon.svg"), type: "image/svg+xml" }],
    shortcut: uiPath("/favicon.svg"),
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
