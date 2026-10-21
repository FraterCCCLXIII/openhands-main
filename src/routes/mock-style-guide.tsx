/* eslint-disable i18next/no-literal-string -- dev-only design reference page, not product copy */
import { Navigate } from "react-router";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ErrorMessageBanner } from "#/components/features/chat/error-message-banner";
import { ConversationStatusDot } from "#/components/features/conversation-panel/conversation-status-dot";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { BANNER_SURFACE_CLASSNAME } from "#/components/shared/banner-surface";
import {
  AGENT_ACCENT_ICONS,
  agentProfileAccentColor,
  agentProfileIconIndex,
} from "#/components/features/chat/components/agent-profile-accent";
import { ToggleSwitchVisual } from "#/ui/toggle-switch";
import { ComboboxCaretInline } from "#/ui/combobox-caret";
import { Typography } from "#/ui/typography";
import {
  chatInputModelPillClassName,
  chatInputPillButtonClassName,
} from "#/utils/form-control-classes";
import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import { cn } from "#/utils/utils";

const COLOR_TOKENS = [
  "bg-canvas-base",
  "bg-base-secondary",
  "bg-surface",
  "bg-surface-raised",
  "bg-tertiary",
  "bg-primary",
  "text-foreground",
  "text-muted",
  "border-border",
  "text-status-success",
  "text-status-error",
  "text-feedback-warning",
];

const RADII = [
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
  "rounded-full",
];

const STATUSES: ExecutionStatus[] = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.IDLE,
  ExecutionStatus.FINISHED,
  ExecutionStatus.PAUSED,
  ExecutionStatus.ERROR,
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border-subtle pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function MockStyleGuide() {
  // Dev-mock only: the page is a design reference, not a product screen.
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      data-testid="mock-style-guide"
      className="mx-auto flex max-w-4xl flex-col gap-8 p-8"
    >
      <header className="flex flex-col gap-2">
        <Typography.H1>Style guide</Typography.H1>
        <p className="text-sm text-muted">
          Every shared control and surface, rendered with the real components.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <BrandButton variant="primary" type="button">
            Primary
          </BrandButton>
          <BrandButton variant="secondary" type="button">
            Secondary
          </BrandButton>
          <BrandButton variant="tertiary" type="button">
            Tertiary
          </BrandButton>
          <BrandButton variant="danger" type="button">
            Danger
          </BrandButton>
          <BrandButton variant="ghost-danger" type="button">
            Ghost danger
          </BrandButton>
          <BrandButton variant="primary" type="button" isDisabled>
            Disabled
          </BrandButton>
        </div>
        <p className="text-xs text-muted">
          Primary buttons use the gold sheen and 3D lift. Hover fades in 200ms;
          reduced-motion turns it off.
        </p>
      </Section>

      <Section title="Pills, carets, and chips">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              chatInputPillButtonClassName,
              chatInputModelPillClassName,
              "bg-surface",
            )}
          >
            default <ComboboxCaretInline isOpen={false} />
          </span>
          <span
            className={cn(
              chatInputPillButtonClassName,
              chatInputModelPillClassName,
              "bg-surface",
            )}
          >
            OpenHands · GLM 5.2 <ComboboxCaretInline isOpen />
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            Collapsed <ExpandChevron expanded={false} />
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            Expanded <ExpandChevron expanded />
          </span>
        </div>
        <p className="text-xs text-muted">
          Carets point right when closed and down when open.
        </p>
      </Section>

      <Section title="Toggles and checkboxes">
        <div className="flex flex-wrap items-center gap-6">
          <ToggleSwitchVisual enabled size="md" />
          <ToggleSwitchVisual enabled={false} size="md" />
          <ToggleSwitchVisual enabled size="sm" />
          <ToggleSwitchVisual enabled={false} size="sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="oh-checkbox" />{" "}
            Send anonymous usage data
          </label>
        </div>
      </Section>

      <Section title="Status banners">
        <div className="flex flex-col gap-2">
          <ErrorMessageBanner
            message="Unable to connect to server"
            onRetry={() => {}}
            onDismiss={() => {}}
          />
          <div className={BANNER_SURFACE_CLASSNAME}>
            <span className="text-sm">
              Your LLM isn&apos;t set up yet, so conversations won&apos;t run.
            </span>
            <BrandButton
              variant="primary"
              type="button"
              className="h-6 min-h-0 rounded-md"
            >
              Set up LLM
            </BrandButton>
          </div>
        </div>
        <p className="text-xs text-muted">
          Stacked above the composer. Every notice shares one radius, padding,
          outline, and 44px minimum height.
        </p>
      </Section>

      <Section title="Status dots">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {STATUSES.map((status) => (
            <span key={status} className="inline-flex items-center gap-2">
              <ConversationStatusDot
                executionStatus={status}
                showTooltip={false}
              />
              {status}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Agent icons and accents">
        <div className="flex flex-wrap items-center gap-3">
          {[
            "default",
            "Architect",
            "Debugger",
            "Code Reviewer",
            "Refactorer",
            "Test Engineer",
            "Prototyper",
          ].map((name) => {
            const Icon = AGENT_ACCENT_ICONS[agentProfileIconIndex(name)];
            return (
              <span key={name} className="flex items-center gap-2 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-interactive-hover">
                  <Icon
                    width={14}
                    height={14}
                    style={{ color: agentProfileAccentColor(name) }}
                    aria-hidden
                  />
                </span>
                {name}
              </span>
            );
          })}
        </div>
      </Section>

      <Section title="Tooltips">
        <StyledTooltip content="Tooltip label" placement="top">
          <BrandButton variant="secondary" type="button">
            Hover me
          </BrandButton>
        </StyledTooltip>
      </Section>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "size-6 rounded-md border border-border",
                  token.startsWith("bg-") && token,
                )}
              />
              <code className="text-muted">{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap items-center gap-4">
          {RADII.map((radius) => (
            <div
              key={radius}
              className="flex flex-col items-center gap-2 text-xs text-muted"
            >
              <span
                className={cn(
                  "size-12 border border-border bg-surface-raised",
                  radius,
                )}
              />
              {radius}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="modal-surface-gradient flex flex-col gap-2 rounded-2xl border border-border bg-base-secondary p-6">
          <span className="text-sm font-semibold">Modal surface</span>
          <span className="text-sm text-muted">
            A subtle top-to-bottom gradient over base-secondary.
          </span>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-[0_4px_12px_rgb(0_0_0/0.18)]">
          <span className="text-sm">Card with subtle drop shadow</span>
        </div>
      </Section>

      <Section title="Conversation rules">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
          <li>
            The composer is a rounded panel, with the model, agent, and LLM
            chips in its bottom row.
          </li>
          <li>
            Pills are fully rounded. Agent and LLM chips sit side by side, with
            the same height.
          </li>
          <li>
            Popovers use one 8px-padded surface. Dividers and search fields sit
            inside that padding, and rows keep equal left and right insets.
          </li>
          <li>
            Notices stack above the composer with a 6px gap and share one
            surface.
          </li>
          <li>
            Errors and warnings use the status colors. Success uses the green
            status color.
          </li>
          <li>
            Hover states fade over 200ms. Reduced-motion users get no motion.
          </li>
        </ul>
      </Section>
    </div>
  );
}
