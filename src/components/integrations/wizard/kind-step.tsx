import { KeyRound, Waypoints } from "lucide-react";

import { cn } from "@/src/lib/utils";
import type { IntegrationKind } from "@/src/components/integrations/wizard/utils";

interface KindStepProps {
  allowRawMcpInstall?: boolean;
  selectedKind: IntegrationKind | null;
  onSelectKind: (kind: IntegrationKind) => void;
}

export const KindStep = ({
  allowRawMcpInstall = true,
  selectedKind,
  onSelectKind,
}: KindStepProps) => (
  <div className="grid gap-4 md:grid-cols-2">
    {[
      {
        kind: "managed" as const,
        title: "Managed connector",
        body: "Pick from the service-level managed connectors, connect your account when OAuth is available, and let the dashboard discover the available tools.",
        icon: KeyRound,
        disabled: false,
        disabledReason: null,
      },
      {
        kind: "mcp" as const,
        title: "MCP server",
        body: "Connects to a remote MCP server, lists all tools, and infers auth from the credentials you provide.",
        icon: Waypoints,
        disabled: !allowRawMcpInstall,
        disabledReason: !allowRawMcpInstall
          ? "Only app administrators can add raw MCP server URLs. Ask an admin to register a managed connector instead."
          : null,
      },
    ].map((option) => (
      <button
        key={option.kind}
        type="button"
        disabled={option.disabled}
        aria-disabled={option.disabled}
        className={cn(
          "cursor-pointer rounded-xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          selectedKind === option.kind
            ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-bg-active)]",
        )}
        onClick={() => onSelectKind(option.kind)}
      >
        <option.icon className="mb-4 h-6 w-6 text-[var(--color-accent)]" />
        <p className="font-semibold text-white">{option.title}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
          {option.body}
        </p>
        {option.disabledReason ? (
          <p className="mt-3 text-xs leading-6 text-[var(--color-text-base)]">
            {option.disabledReason}
          </p>
        ) : null}
      </button>
    ))}
  </div>
);
