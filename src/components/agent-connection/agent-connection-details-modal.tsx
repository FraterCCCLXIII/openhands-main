import {
  AgentConnectionDetailsContent,
  type AgentConnectionDetailsContentProps,
} from "@/src/components/agent-connection/agent-connection-details-content";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalShellClassName } from "@/src/components/ui/modal-shell";
import { AGENT_CONNECTION_PAGE_COPY } from "@/src/constants/agent-connection-page";
import { cn } from "@/src/lib/utils";
import { settingsListContainerClassName } from "@/src/styles/settings-list-classes";

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
      <section
        data-testid="agent-connection-details-modal"
        className={cn(modalShellClassName("lg"), "min-h-0 max-h-[85vh] gap-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="agent-connection-details-modal-close"
        />

        <header className="relative shrink-0 px-6 pb-4 pt-6 pr-12">
          <h2 className="text-lg font-medium text-white">
            {AGENT_CONNECTION_PAGE_COPY.connectionDetailsTitle}
          </h2>
          <p className="mt-1 text-sm leading-5 text-tertiary-light">
            {AGENT_CONNECTION_PAGE_COPY.connectionDetailsDescription}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
          <div
            className={cn(
              settingsListContainerClassName,
              "flex min-h-0 flex-1 flex-col",
            )}
          >
            <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto p-4">
              <AgentConnectionDetailsContent {...contentProps} />
            </div>
          </div>
        </div>
      </section>
    </ModalBackdrop>
  );
}
