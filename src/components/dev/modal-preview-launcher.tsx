import React from "react";
import { Settings } from "lucide-react";
import { INTEGRATION_CATALOG } from "@openhands/extensions/integrations";
import { BuiltInIntegrationChoiceModal } from "#/components/features/automations/built-in-integration-choice-modal";
import { InstallServerModal } from "#/components/features/mcp-page/install-server-modal";
import { getMarketplaceEntryById } from "#/utils/mcp-marketplace-utils";

type Preview =
  | { kind: "template"; entryId: string; state: "connected" | "connect" }
  | { kind: "mcp"; entryId: string };

const TEMPLATE_INTEGRATIONS: { entryId: string; label: string }[] = [
  { entryId: "slack", label: "Slack channel monitor" },
  { entryId: "github", label: "GitHub issue to PR" },
  { entryId: "gitlab", label: "GitLab issue to MR" },
  { entryId: "jira", label: "Jira issue to PR/MR" },
];

const MCP_INTEGRATIONS: { entryId: string; label: string }[] = [
  { entryId: "github", label: "GitHub" },
  { entryId: "gitlab", label: "GitLab" },
  { entryId: "atlassian-rovo", label: "Atlassian Rovo" },
  { entryId: "slack", label: "Slack" },
];

/**
 * Mock-mode only: a small gear in the lower left that opens the built-in
 * integration modals directly, so each state can be reviewed without driving
 * the app into it.
 */
export function ModalPreviewLauncher() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<Preview | null>(null);

  const open = (next: Preview) => {
    setPreview(next);
    setIsOpen(false);
  };
  const close = () => setPreview(null);

  const entry = preview
    ? getMarketplaceEntryById(preview.entryId, INTEGRATION_CATALOG)
    : undefined;

  const itemClassName =
    "block w-full rounded px-2 py-1 text-left text-xs text-contrast hover:bg-base-secondary";

  return (
    <>
      <div className="fixed bottom-2 right-2 z-[60]">
        <button
          type="button"
          aria-label="Preview modals"
          data-testid="modal-preview-gear"
          onClick={() => setIsOpen((v) => !v)}
          className="flex size-7 items-center justify-center rounded-full border border-border bg-surface-raised text-tertiary-light opacity-60 hover:opacity-100"
        >
          <Settings className="size-4" aria-hidden />
        </button>
        {isOpen && (
          <div
            data-testid="modal-preview-menu"
            className="absolute bottom-9 right-0 w-60 rounded-lg border border-border bg-surface-raised p-2 shadow-lg"
          >
            <p className="px-2 pb-1 text-[10px] uppercase text-tertiary-light">
              Choose your setup
            </p>
            {TEMPLATE_INTEGRATIONS.map(({ entryId, label }) => (
              <div key={entryId}>
                <button
                  type="button"
                  className={itemClassName}
                  onClick={() =>
                    open({ kind: "template", entryId, state: "connected" })
                  }
                >
                  {label} — connected
                </button>
                <button
                  type="button"
                  className={itemClassName}
                  onClick={() =>
                    open({ kind: "template", entryId, state: "connect" })
                  }
                >
                  {label} — not connected
                </button>
              </div>
            ))}
            <p className="px-2 pb-1 pt-2 text-[10px] uppercase text-tertiary-light">
              Built-In integration (MCP install)
            </p>
            {MCP_INTEGRATIONS.map(({ entryId, label }) => (
              <button
                key={entryId}
                type="button"
                className={itemClassName}
                onClick={() => open({ kind: "mcp", entryId })}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {preview?.kind === "template" && entry && (
        <BuiltInIntegrationChoiceModal
          integration={entry}
          state={preview.state}
          onClose={close}
          onUseBuiltIn={close}
          onContinuePolling={close}
        />
      )}
      {preview?.kind === "mcp" && entry && (
        <InstallServerModal
          entry={entry}
          existingServers={[]}
          onClose={close}
        />
      )}
    </>
  );
}
