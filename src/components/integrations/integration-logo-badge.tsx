"use client";

import React from "react";

import {
  DEFAULT_INTEGRATION_LOGO_BG,
  DEFAULT_INTEGRATION_LOGO_COLOR,
  getIntegrationLogoBranding,
  hasIntegrationLogoBrandingOverride,
} from "@/src/components/integrations/integration-logo-branding";
import { getIntegrationLogo } from "@/src/components/integrations/integration-logos";
import { cn } from "@/src/lib/utils";

interface IntegrationLogoBadgeProps {
  slug: string;
  name: string;
  logoUrl?: string;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function IntegrationLogoBadge({
  slug,
  name,
  logoUrl,
  iconBg,
  iconColor,
  className,
}: IntegrationLogoBadgeProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const resolvedBranding = getIntegrationLogoBranding(slug);

  React.useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const brandingLocked = hasIntegrationLogoBrandingOverride(slug);
  const showRemoteLogo = Boolean(logoUrl) && !imageFailed && !brandingLocked;
  const backgroundColor = brandingLocked
    ? resolvedBranding.iconBg
    : (iconBg ?? resolvedBranding.iconBg ?? DEFAULT_INTEGRATION_LOGO_BG);
  const foregroundColor = brandingLocked
    ? resolvedBranding.iconColor
    : (iconColor ?? resolvedBranding.iconColor ?? DEFAULT_INTEGRATION_LOGO_COLOR);

  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1.5",
        "border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        "[&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-5 [&>svg]:max-w-5",
        "[&>img]:h-full [&>img]:w-full [&>img]:object-contain",
        className,
      )}
      style={{
        backgroundColor,
        color: foregroundColor,
      }}
    >
      {showRemoteLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        getIntegrationLogo(slug)
      )}
    </span>
  );
}
