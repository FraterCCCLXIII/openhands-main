import {
  AgentConnectionDetailsContent,
  type AgentConnectionDetailsContentProps,
} from "@/src/components/agent-connection/agent-connection-details-content";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { AGENT_CONNECTION_PAGE_COPY } from "@/src/constants/agent-connection-page";
import { cn } from "@/src/lib/utils";

interface AgentConnectionDetailsModalProps
  extends AgentConnectionDetailsContentProps {
  onClose: () => void;
}

export function AgentConnectionDetailsModal({
  onClose,
  ...contentProps
}: AgentConnectionDetailsModalProps) {
  return (
    <ModalBackdrop
      ariaLabel={AGENT_CONNECTION_PAGE_COPY.connectionDetailsModalAriaLabel}
      onClose={onClose}
    >
      <div
        data-testid="agent-connection-details-modal"
        className={cn(
          "relative flex max-h-[85vh] w-[640px] max-w-[90vw] flex-col gap-4 overflow-y-auto",
          "rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6 custom-scrollbar-always",
        )}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="agent-connection-details-modal-close"
        />

        <h2 className="pr-6 text-lg font-medium text-white">
          {AGENT_CONNECTION_PAGE_COPY.connectionDetailsTitle}
        </h2>

        <AgentConnectionDetailsContent {...contentProps} />
      </div>
    </ModalBackdrop>
  );
}
