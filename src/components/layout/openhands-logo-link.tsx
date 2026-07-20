import Link from "next/link";

import { cn } from "@/src/lib/utils";
import { uiPath } from "@/src/shared/paths";

const LOGO_WIDTH = 34;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 30) / 46);

interface OpenHandsLogoLinkProps {
  className?: string;
}

export function OpenHandsLogoLink({ className }: OpenHandsLogoLinkProps) {
  return (
    <Link
      href="/integrations"
      aria-label="OpenHands"
      className={cn("inline-flex shrink-0 items-center overflow-visible", className)}
    >
      <img
        src={uiPath("/openhands-logo.svg")}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        alt=""
        className="max-w-none shrink-0"
      />
    </Link>
  );
}
