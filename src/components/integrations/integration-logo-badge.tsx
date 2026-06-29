"use client";

import React from "react";

import { getIntegrationLogo } from "@/src/components/integrations/integration-logos";
import { cn } from "@/src/lib/utils";

interface IntegrationLogoBadgeProps {
  slug: string;
  name: string;
  logoUrl?: string;
  className?: string;
}

export function IntegrationLogoBadge({
  slug,
  name,
  logoUrl,
  className,
}: IntegrationLogoBadgeProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const showRemoteLogo = Boolean(logoUrl) && !imageFailed;

  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg",
        "border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        "bg-[var(--oh-color-tertiary)] text-white",
        "[&>svg]:h-5 [&>svg]:w-5 [&>img]:h-5 [&>img]:w-5 [&>img]:object-contain",
        className,
      )}
    >
      {showRemoteLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
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
