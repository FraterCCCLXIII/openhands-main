import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "#/context/navigation-context";
import { MessageEvent } from "#/types/agent-server/core";
import { ChatMessage } from "../../../features/chat/chat-message";
import { ImageCarousel } from "../../../features/images/image-carousel";
import { parseMessageFromEvent } from "../event-content-helpers/parse-message-from-event";
import { extractAgentNotifications } from "#/components/features/chat/agent-notifications-parser";
import { CriticResultDisplay } from "./critic-result-display";
import { CollapsibleThinking } from "./collapsible-thinking";
import {
  getReasoningContent,
  splitInlineThink,
} from "../event-thought-helpers";
import { Info } from "lucide-react";
import { TurnDetailsPanel } from "#/components/shared/turn-details-panel";
import { getMessageDetails } from "#/utils/feed-updates";
import RepoForkedIcon from "#/icons/repo-forked.svg?react";
import { I18nKey } from "#/i18n/declaration";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useForkConversation } from "#/hooks/mutation/use-fork-conversation";
import { setConversationState } from "#/utils/conversation-local-storage";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { cn } from "#/utils/utils";

interface UserAssistantEventMessageProps {
  event: MessageEvent;
  isLastMessage: boolean;
  isFromPlanningAgent: boolean;
}

function UserAssistantEventMessageComponent({
  event,
  isFromPlanningAgent,
}: UserAssistantEventMessageProps) {
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const { conversationId } = useOptionalConversationId();
  const isCloud = useActiveBackend().backend.kind === "cloud";
  const { mutate: forkConversation, isPending: isForking } =
    useForkConversation();
  // Blocks a same-tick double-click, before `isForking` flips.
  const forkInFlightRef = React.useRef(false);

  const parsed = parseMessageFromEvent(event);
  const displayText =
    event.source === "agent"
      ? extractAgentNotifications(parsed).message
      : parsed;
  // Route an inline <think> block (e.g. from a streamed reply) to the thinking
  // section so reloaded conversations match the live rendering.
  const { reasoning: inlineThink, message } =
    event.source === "agent"
      ? splitInlineThink(displayText)
      : { reasoning: "", message: displayText };
  // The finished message replaces its streaming slot outright, so reasoning the
  // model streamed must render from the message itself or it vanishes on
  // finalize (and never shows after a reload).
  const reasoning = [
    event.source === "agent" ? getReasoningContent(event.llm_message) : "",
    inlineThink,
  ]
    .filter(Boolean)
    .join("\n\n");

  const imageUrls: string[] = [];
  if (Array.isArray(event.llm_message.content)) {
    event.llm_message.content.forEach((content) => {
      if (content.type === "image") {
        imageUrls.push(...content.image_urls);
      }
    });
  }

  // "Branch from here": a user message is "edit message" (excludes the message,
  // restores its text to the composer); an assistant message branches
  // inclusively. Local agent-server only, inside a conversation.
  const canBranch = !isCloud && !!conversationId;
  const handleBranch = () => {
    if (!conversationId || isForking || forkInFlightRef.current) return;
    forkInFlightRef.current = true;

    // Distinct title so the fork doesn't read identically to its source.
    // getCurrentConversation() is a shared singleton — match the id in case it
    // still holds the previously-viewed conversation.
    const source = ConversationService.getCurrentConversation();
    const sourceTitle =
      source?.id === conversationId ? source.title : undefined;
    const branchTitle = sourceTitle ? `${sourceTitle} (branch)` : undefined;

    // Only edit when there's text: an image-only message parses to "", so
    // branch it inclusively rather than dropping the image.
    const isEdit = event.source === "user" && message.length > 0;

    forkConversation(
      {
        sourceConversationId: conversationId,
        eventId: event.id,
        ...(isEdit ? { editText: message } : {}),
        ...(branchTitle ? { title: branchTitle } : {}),
      },
      {
        onSuccess: ({ info, excluded }) => {
          // Prefill only when excluded (else the send duplicates it). Seed the
          // fork's saved draft before navigating: the composer clears itself
          // on the conversation switch and then restores that draft, so text
          // pushed into it before the route settles would be wiped.
          if (excluded) {
            setConversationState(info.id, { draftMessage: message });
          }
          navigate(`/conversations/${info.id}`);
        },
        onError: (error) =>
          displayErrorToast(error instanceof Error ? error.message : null),
        onSettled: () => {
          forkInFlightRef.current = false;
        },
      },
    );
  };
  const [showDetails, setShowDetails] = React.useState(false);
  const canShowDetails = event.source === "agent";
  const actionList = [
    ...(canBranch
      ? [
          {
            icon: <RepoForkedIcon width={15} height={15} aria-hidden />,
            onClick: handleBranch,
            tooltip: t(I18nKey.CHAT_INTERFACE$BRANCH_FROM_HERE),
          },
        ]
      : []),
    ...(canShowDetails
      ? [
          {
            icon: <Info size={15} aria-hidden />,
            onClick: () => setShowDetails((open) => !open),
            tooltip: t(I18nKey.CHAT_INTERFACE$DETAILS),
          },
        ]
      : []),
  ];
  const actions = actionList.length > 0 ? actionList : undefined;

  const isUserMessage = event.source === "user";

  return (
    <div
      className={cn("flex w-full flex-col", isUserMessage && "items-end")}
      {...(isUserMessage
        ? { "data-conversation-turn-id": String(event.id) }
        : {})}
    >
      {reasoning && <CollapsibleThinking content={reasoning} />}
      <ChatMessage
        type={event.source}
        message={message}
        isFromPlanningAgent={isFromPlanningAgent}
        actions={actions}
        timestamp={event.timestamp}
      >
        {imageUrls.length > 0 && (
          <ImageCarousel size="small" images={imageUrls} />
        )}
      </ChatMessage>
      {showDetails && canShowDetails ? (
        <div className="mb-1 w-full pl-1">
          <TurnDetailsPanel details={getMessageDetails(event)} />
        </div>
      ) : null}
      {event.source === "agent" && event.critic_result != null && (
        <CriticResultDisplay criticResult={event.critic_result} />
      )}
    </div>
  );
}

// Appending at the live tail keeps historical event objects and these scalar
// rendering inputs stable. Context and store subscriptions still propagate,
// while unchanged message wrappers avoid reconciling their large DOM subtrees.
export const UserAssistantEventMessage = React.memo(
  UserAssistantEventMessageComponent,
);
