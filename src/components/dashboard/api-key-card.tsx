import { CheckCircle2, Copy, Eye, EyeOff, RotateCw } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

interface DashboardApiKeyCardProps {
  badgeLabel: string;
  badgeTone?: "default" | "success" | "warning" | "danger";
  copied: boolean;
  description: string;
  label: string;
  maskedValue: string;
  onCopy: () => void | Promise<void>;
  onRevealToggle: () => void | Promise<void>;
  onRotate?: () => void | Promise<void>;
  revealDisabled?: boolean;
  revealed: boolean;
  rotateLabel?: string;
  rotateDisabled?: boolean;
  variant?: "card" | "inline";
}

export const DashboardApiKeyCard = ({
  badgeLabel,
  badgeTone = "default",
  copied,
  description,
  label,
  maskedValue,
  onCopy,
  onRevealToggle,
  onRotate,
  revealDisabled = false,
  revealed,
  rotateLabel = "Rotate",
  rotateDisabled,
  variant = "card",
}: DashboardApiKeyCardProps) => (
  <div
    className={
      variant === "card"
        ? "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
        : undefined
    }
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <p className="mt-1 text-sm text-[var(--color-text-base)]">{description}</p>
      </div>
      <Badge tone={badgeTone}>{badgeLabel}</Badge>
    </div>
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
      <code className="block break-all text-sm text-white">{maskedValue}</code>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        className="h-8 gap-2 rounded-md px-3 text-xs"
        onClick={onRevealToggle}
        disabled={revealDisabled}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {revealed ? "Hide" : "Reveal"}
      </Button>
      <Button
        variant="secondary"
        className="h-8 gap-2 rounded-md px-3 text-xs"
        onClick={onCopy}
        disabled={revealDisabled}
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        Copy
      </Button>
      {onRotate ? (
        <Button
          variant="secondary"
          className="h-8 gap-2 rounded-md px-3 text-xs"
          onClick={onRotate}
          disabled={rotateDisabled ?? revealDisabled}
          aria-label={`${rotateLabel} ${label.toLowerCase()}`}
        >
          <RotateCw className="h-4 w-4" />
          {rotateLabel}
        </Button>
      ) : null}
    </div>
  </div>
);
