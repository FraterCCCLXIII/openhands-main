import { createElement, type ReactNode } from "react";
import { FaMicrosoft } from "react-icons/fa6";
import {
  PiMicrosoftOutlookLogo,
  PiMicrosoftTeamsLogo,
} from "react-icons/pi";
import {
  SiAsana,
  SiBitbucket,
  SiBox,
  SiCanva,
  SiClickup,
  SiConfluence,
  SiDatadog,
  SiDiscord,
  SiDropbox,
  SiGitlab,
  SiGmail,
  SiGooglecalendar,
  SiGoogledocs,
  SiGoogledrive,
  SiGooglesheets,
  SiHubspot,
  SiIntercom,
  SiJira,
  SiMailchimp,
  SiMiro,
  SiNetlify,
  SiOkta,
  SiPosthog,
  SiQuickbooks,
  SiSalesforce,
  SiShopify,
  SiTrello,
  SiVercel,
  SiWebflow,
  SiXero,
  SiZendesk,
  SiZoom,
} from "react-icons/si";
import { TbBrandMonday, TbBrandOnedrive } from "react-icons/tb";

import { CUSTOM_OAUTH_PROVIDER_LOGOS } from "@/src/components/integrations/custom-oauth-provider-logos";

const LOGO_CLASS_NAME = "h-5 w-5";

const simpleIcon = (Icon: React.ComponentType<{ className?: string; color?: string }>) =>
  createElement(Icon, { className: LOGO_CLASS_NAME, color: "currentColor" });

/** OAuth provider catalog slugs backed by custom inline SVG marks. */
export const CUSTOM_OAUTH_PROVIDER_LOGO_SLUGS = new Set(
  Object.keys(CUSTOM_OAUTH_PROVIDER_LOGOS),
);

export const OAUTH_PROVIDER_LOGOS: Record<string, ReactNode> = {
  "google-docs": simpleIcon(SiGoogledocs),
  "google-drive": simpleIcon(SiGoogledrive),
  "google-sheets": simpleIcon(SiGooglesheets),
  gmail: simpleIcon(SiGmail),
  "google-calendar": simpleIcon(SiGooglecalendar),
  jira: simpleIcon(SiJira),
  confluence: simpleIcon(SiConfluence),
  asana: simpleIcon(SiAsana),
  trello: simpleIcon(SiTrello),
  clickup: simpleIcon(SiClickup),
  monday: simpleIcon(TbBrandMonday),
  dropbox: simpleIcon(SiDropbox),
  box: simpleIcon(SiBox),
  "microsoft-outlook": simpleIcon(PiMicrosoftOutlookLogo),
  "microsoft-teams": simpleIcon(PiMicrosoftTeamsLogo),
  onedrive: simpleIcon(TbBrandOnedrive),
  sharepoint: simpleIcon(FaMicrosoft),
  salesforce: simpleIcon(SiSalesforce),
  hubspot: simpleIcon(SiHubspot),
  zendesk: simpleIcon(SiZendesk),
  intercom: simpleIcon(SiIntercom),
  shopify: simpleIcon(SiShopify),
  discord: simpleIcon(SiDiscord),
  zoom: simpleIcon(SiZoom),
  webflow: simpleIcon(SiWebflow),
  miro: simpleIcon(SiMiro),
  canva: simpleIcon(SiCanva),
  datadog: simpleIcon(SiDatadog),
  posthog: simpleIcon(SiPosthog),
  vercel: simpleIcon(SiVercel),
  netlify: simpleIcon(SiNetlify),
  okta: simpleIcon(SiOkta),
  mailchimp: simpleIcon(SiMailchimp),
  quickbooks: simpleIcon(SiQuickbooks),
  xero: simpleIcon(SiXero),
  gitlab: simpleIcon(SiGitlab),
  bitbucket: simpleIcon(SiBitbucket),
  ...CUSTOM_OAUTH_PROVIDER_LOGOS,
};
