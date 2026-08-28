import { createElement, type ReactNode } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  Clock,
  Database,
  Flame,
  Folder,
  GitBranch,
  Globe,
  ListTree,
  MousePointerClick,
  Plug,
  Search,
  Sparkles,
  Telescope,
  TestTube,
} from "lucide-react";
import {
  SiAirtable,
  SiAtlassian,
  SiBrave,
  SiClickhouse,
  SiCloudflare,
  SiElevenlabs,
  SiFigma,
  SiGithub,
  SiHuggingface,
  SiKagi,
  SiLinear,
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

import { OAUTH_PROVIDER_LOGOS } from "@/src/components/integrations/oauth-provider-logos";

const LOGO_CLASS_NAME = "h-5 w-5";

const simpleIcon = (Icon: React.ComponentType<{ className?: string }>) =>
  createElement(Icon, { className: LOGO_CLASS_NAME });

const lucideLogo = (Icon: typeof Plug) =>
  createElement(Icon, { className: LOGO_CLASS_NAME, strokeWidth: 2.25 });

export const INTEGRATION_FALLBACK_LOGO = lucideLogo(Bot);

const MCP_CATALOG_LOGOS: Record<string, ReactNode> = {
  github: simpleIcon(SiGithub),
  slack: simpleIcon(SiSlack),
  tavily: createElement(Search, { className: LOGO_CLASS_NAME, strokeWidth: 2.5 }),
  linear: simpleIcon(SiLinear),
  notion: simpleIcon(SiNotion),
  atlassian: simpleIcon(SiAtlassian),
  sentry: simpleIcon(SiSentry),
  stripe: simpleIcon(SiStripe),
  paypal: simpleIcon(SiPaypal),
  "cloudflare-docs": simpleIcon(SiCloudflare),
  "cloudflare-bindings": simpleIcon(SiCloudflare),
  "cloudflare-observability": simpleIcon(SiCloudflare),
  huggingface: simpleIcon(SiHuggingface),
  deepwiki: lucideLogo(BookOpen),
  git: lucideLogo(GitBranch),
  "brave-search": simpleIcon(SiBrave),
  exa: lucideLogo(Telescope),
  firecrawl: lucideLogo(Flame),
  apify: lucideLogo(Bot),
  fetch: lucideLogo(Globe),
  "browser-mcp": lucideLogo(MousePointerClick),
  playwright: lucideLogo(TestTube),
  supabase: simpleIcon(SiSupabase),
  neon: lucideLogo(Database),
  mongodb: simpleIcon(SiMongodb),
  redis: simpleIcon(SiRedis),
  filesystem: lucideLogo(Folder),
  memory: lucideLogo(Brain),
  "sequential-thinking": lucideLogo(ListTree),
  time: lucideLogo(Clock),
  everything: lucideLogo(Sparkles),
  figma: simpleIcon(SiFigma),
  airtable: simpleIcon(SiAirtable),
  obsidian: simpleIcon(SiObsidian),
  elevenlabs: simpleIcon(SiElevenlabs),
  resend: simpleIcon(SiResend),
  "cloudflare-builds": simpleIcon(SiCloudflare),
  "cloudflare-browser-rendering": simpleIcon(SiCloudflare),
  kagi: simpleIcon(SiKagi),
  clickhouse: simpleIcon(SiClickhouse),
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
