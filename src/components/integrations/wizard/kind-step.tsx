import { KeyRound, Waypoints } from "lucide-react";

import { cn } from "@/src/lib/utils";
import type { IntegrationKind } from "@/src/components/integrations/wizard/utils";

interface KindStepProps {
  selectedKind: IntegrationKind | null;
  onSelectKind: (kind: IntegrationKind) => void;
}

export const KindStep = ({
  selectedKind,
  onSelectKind,
}: KindStepProps) => (
  <div className="grid gap-4 md:grid-cols-2">
    {[
      {
        kind: "built_in" as const,
        title: "Built-in connector",
        body: "Pick from the service-level managed connectors, connect your account when OAuth is available, and let the dashboard discover the available functions.",
        icon: KeyRound,
      },
      {
        kind: "mcp" as const,
        title: "MCP server",
        body: "Connects to a remote MCP server, lists all tools, and infers auth from the credentials you provide.",
        icon: Waypoints,
      },
    ].map((option) => (
      <button
        key={option.kind}
        type="button"
        className={cn(
          "cursor-pointer rounded-xl border p-5 text-left transition-colors",
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
      </button>
    ))}
  </div>
);
