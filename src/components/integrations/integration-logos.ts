import { createElement, type ReactNode } from "react";
import { Plug } from "lucide-react";
import {
  INTEGRATION_FALLBACK_LOGO as EXTENSION_FALLBACK_LOGO,
  INTEGRATION_LOGOS as EXTENSION_LOGOS,
} from "@openhands/extensions/integrations/logos";

import { OAUTH_PROVIDER_LOGOS } from "@/src/components/integrations/oauth-provider-logos";

const LOGO_CLASS_NAME = "h-5 w-5";

const lucideLogo = (Icon: typeof Plug) =>
  createElement(Icon, { className: LOGO_CLASS_NAME, strokeWidth: 2.25 });

export const INTEGRATION_FALLBACK_LOGO = EXTENSION_FALLBACK_LOGO;

export const INTEGRATION_LOGOS: Record<string, ReactNode> = {
  ...EXTENSION_LOGOS,
  ...OAUTH_PROVIDER_LOGOS,
  "custom-mcp": lucideLogo(Plug),
};

export function hasBundledIntegrationLogo(slug: string): boolean {
  return slug in INTEGRATION_LOGOS;
}

export function getIntegrationLogo(slug: string): ReactNode {
  return INTEGRATION_LOGOS[slug] ?? INTEGRATION_FALLBACK_LOGO;
}
