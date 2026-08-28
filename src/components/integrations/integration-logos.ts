import { createElement, type ReactNode } from "react";
import { BookOpen, Bot, Plug } from "lucide-react";
import {
  SiAirtable,
  SiAtlassian,
  SiBrave,
  SiClickhouse,
  SiCloudflare,
  SiElevenlabs,
  SiFigma,
  SiGit,
  SiGithub,
  SiHuggingface,
  SiKagi,
  SiLinear,
  SiModelcontextprotocol,
  SiMongodb,
  SiNotion,
  SiObsidian,
  SiPaypal,
  SiRedis,
  SiResend,
  SiSentry,
  SiSlack,
  SiStripe,
  SiSupabase,
} from "react-icons/si";

import { CUSTOM_CATALOG_LOGOS } from "@/src/components/integrations/custom-catalog-logos";
import { OAUTH_PROVIDER_LOGOS } from "@/src/components/integrations/oauth-provider-logos";

const LOGO_CLASS_NAME = "h-5 w-5";

const simpleIcon = (Icon: React.ComponentType<{ className?: string }>) =>
  createElement(Icon, { className: LOGO_CLASS_NAME });

const lucideLogo = (Icon: typeof Plug) =>
  createElement(Icon, { className: LOGO_CLASS_NAME, strokeWidth: 2.25 });

export const INTEGRATION_FALLBACK_LOGO = lucideLogo(Bot);

const MCP_REFERENCE_LOGO = simpleIcon(SiModelcontextprotocol);

const MCP_CATALOG_LOGOS: Record<string, ReactNode> = {
  github: simpleIcon(SiGithub),
  slack: simpleIcon(SiSlack),
  linear: simpleIcon(SiLinear),
  notion: simpleIcon(SiNotion),
  atlassian: simpleIcon(SiAtlassian),
  "atlassian-rovo": simpleIcon(SiAtlassian),
  sentry: simpleIcon(SiSentry),
  stripe: simpleIcon(SiStripe),
  paypal: simpleIcon(SiPaypal),
  "cloudflare-docs": simpleIcon(SiCloudflare),
  "cloudflare-bindings": simpleIcon(SiCloudflare),
  "cloudflare-observability": simpleIcon(SiCloudflare),
  huggingface: simpleIcon(SiHuggingface),
  deepwiki: lucideLogo(BookOpen),
  git: simpleIcon(SiGit),
  "brave-search": simpleIcon(SiBrave),
  supabase: simpleIcon(SiSupabase),
  mongodb: simpleIcon(SiMongodb),
  redis: simpleIcon(SiRedis),
  fetch: MCP_REFERENCE_LOGO,
  filesystem: MCP_REFERENCE_LOGO,
  memory: MCP_REFERENCE_LOGO,
  "sequential-thinking": MCP_REFERENCE_LOGO,
  time: MCP_REFERENCE_LOGO,
  everything: MCP_REFERENCE_LOGO,
  figma: simpleIcon(SiFigma),
  airtable: simpleIcon(SiAirtable),
  obsidian: simpleIcon(SiObsidian),
  elevenlabs: simpleIcon(SiElevenlabs),
  resend: simpleIcon(SiResend),
  "cloudflare-builds": simpleIcon(SiCloudflare),
  "cloudflare-browser-rendering": simpleIcon(SiCloudflare),
  kagi: simpleIcon(SiKagi),
  clickhouse: simpleIcon(SiClickhouse),
  ...CUSTOM_CATALOG_LOGOS,
};

export const INTEGRATION_LOGOS: Record<string, ReactNode> = {
  ...MCP_CATALOG_LOGOS,
  ...OAUTH_PROVIDER_LOGOS,
  "custom-mcp": lucideLogo(Plug),
};

export function hasBundledIntegrationLogo(slug: string): boolean {
  return slug in INTEGRATION_LOGOS;
}

export function getIntegrationLogo(slug: string): ReactNode {
  return INTEGRATION_LOGOS[slug] ?? INTEGRATION_FALLBACK_LOGO;
}
