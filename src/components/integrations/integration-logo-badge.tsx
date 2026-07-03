"use client";

import React from "react";

import { cn } from "@/src/lib/utils";

const DEFAULT_INTEGRATION_LOGO_BG = "var(--oh-surface-muted)";
const DEFAULT_INTEGRATION_LOGO_COLOR = "var(--oh-foreground)";

interface IntegrationLogoBadgeProps {
  slug: string;
  name: string;
  logoUrl?: string | null;
  iconBg?: string | null;
  iconColor?: string | null;
  className?: string;
}

const getInitials = (name: string, slug: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || slug.slice(0, 2).toUpperCase() || "?";
};

export function IntegrationLogoBadge({
  slug,
  name,
  logoUrl,
  iconBg,
  iconColor,
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
        "inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1.5 text-xs font-semibold tracking-[0.14em]",
        "border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        "[&>img]:h-full [&>img]:w-full [&>img]:object-contain",
        className,
      )}
      style={{
        backgroundColor: iconBg ?? DEFAULT_INTEGRATION_LOGO_BG,
        color: iconColor ?? DEFAULT_INTEGRATION_LOGO_COLOR,
      }}
    >
      {showRemoteLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl ?? undefined}
          alt=""
          className="h-full w-full"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        getInitials(name, slug)
      )}
    </span>
  );
}
