import React from "react";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import {
  isMessageEvent,
  isUserMessageEvent,
} from "#/types/agent-server/type-guards";
import {
  CHOICE_TEMPLATE_LANGUAGE,
  parseChoiceTemplate,
} from "#/utils/choice-template";
import { createChatMessage } from "#/services/chat-service";
import { useSendMessage } from "#/hooks/use-send-message";
import { isContentEmpty } from "#/components/features/chat/utils/chat-input.utils";

/** The rail shows at most this many pills (one per digit key). */
export const SUGGESTION_RAIL_MAX_OPTIONS = 9;

const COMPOSER_SELECTOR = '[contenteditable="true"].chat-input';
const DIGIT_CODE_PATTERN = /^(?:Digit|Numpad)([1-9])$/;
const DIGIT_KEY_PATTERN = /^[1-9]$/;

const KEY_ESCAPE = "Escape";
const KEY_ARROW_UP = "ArrowUp";
const KEY_ARROW_DOWN = "ArrowDown";
const KEY_ARROW_LEFT = "ArrowLeft";
const KEY_ARROW_RIGHT = "ArrowRight";

const CHOICE_FENCE_PATTERN = new RegExp(
  `^(\`{3,})${CHOICE_TEMPLATE_LANGUAGE}[^\\S\\n]*\\n([\\s\\S]*?)\\n\\1[^\\S\\n]*$`,
  "m",
);

export interface AgentSuggestions {
  /** Id of the agent message the options came from. */
  messageId: string;
  labels: string[];
}

function getMessageText(event: OpenHandsEvent): string {
  if (!isMessageEvent(event)) return "";
  return event.llm_message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

function parseSuggestionLabels(markdown: string): string[] | null {
  const body = CHOICE_FENCE_PATTERN.exec(markdown)?.[2];
  if (body === undefined) return null;
  const template = parseChoiceTemplate(body);
  if (!template) return null;
  return template.options
    .slice(0, SUGGESTION_RAIL_MAX_OPTIONS)
    .map((option) => option.label);
}

/**
 * Finds the options offered by the latest agent message that carries a valid
 * choice block. A user message after that point means the choice is already
 * answered, so the scan stops there.
 */
export function findAgentSuggestions(
  events: OpenHandsEvent[],
): AgentSuggestions | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (isUserMessageEvent(event)) return null;
    if (isMessageEvent(event) && event.source === "agent") {
      const labels = parseSuggestionLabels(getMessageText(event));
      if (labels) return { messageId: event.id, labels };
    }
  }
  return null;
}

function digitFromEvent(event: React.KeyboardEvent): number | null {
  const fromCode = DIGIT_CODE_PATTERN.exec(event.code)?.[1];
  if (fromCode) return Number(fromCode);
  // Alt+digit yields a symbol on macOS, so `key` only identifies plain digits.
  if (!event.altKey && DIGIT_KEY_PATTERN.test(event.key)) {
    return Number(event.key);
  }
  return null;
}

/**
 * State and keyboard handling for the suggestion rail above the composer.
 * `onKeyDownCapture` belongs on an element wrapping both the rail and the
 * composer.
 */
export function useAgentSuggestionRail(
  events: OpenHandsEvent[],
  disabled: boolean,
) {
  const { send } = useSendMessage();
  const suggestions = React.useMemo(
    () => findAgentSuggestions(events),
    [events],
  );
  const [answeredId, setAnsweredId] = React.useState<string | null>(null);
  const [rawActiveIndex, setActiveIndex] = React.useState(0);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const pillRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const labels =
    !disabled && suggestions && suggestions.messageId !== answeredId
      ? suggestions.labels
      : null;

  const activeIndex = Math.min(
    rawActiveIndex,
    Math.max(0, (labels?.length ?? 1) - 1),
  );

  const focusPill = (index: number) => {
    setActiveIndex(index);
    pillRefs.current[index]?.focus();
  };

  const focusComposer = () => {
    wrapperRef.current?.querySelector<HTMLElement>(COMPOSER_SELECTOR)?.focus();
  };

  const select = (index: number) => {
    if (!suggestions || !labels || index >= labels.length) return;
    const { messageId } = suggestions;
    setAnsweredId(messageId);
    focusComposer();
    send(
      createChatMessage(labels[index], [], [], new Date().toISOString()),
    ).catch(() => setAnsweredId(null));
  };

  const handleRailKey = (event: React.KeyboardEvent, count: number) => {
    const step = (delta: number) => {
      event.preventDefault();
      focusPill((activeIndex + delta + count) % count);
    };
    switch (event.key) {
      case KEY_ARROW_LEFT:
      case KEY_ARROW_UP:
        step(-1);
        return true;
      case KEY_ARROW_RIGHT:
      case KEY_ARROW_DOWN:
        step(1);
        return true;
      case KEY_ESCAPE:
        event.preventDefault();
        focusComposer();
        return true;
      default:
        return false;
    }
  };

  const onKeyDownCapture = (event: React.KeyboardEvent) => {
    if (!labels || event.nativeEvent.isComposing || event.key === "Process") {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;

    const digit = digitFromEvent(event);
    const target = event.target as Node;
    const inRail = railRef.current?.contains(target) ?? false;

    // Alt+digit works anywhere in the composer block; bare digits only while
    // the rail itself has focus, so the composer still types them.
    if (digit !== null && (event.altKey || inRail)) {
      if (digit <= labels.length) {
        event.preventDefault();
        select(digit - 1);
      }
      return;
    }
    if (event.altKey) return;

    if (inRail) {
      handleRailKey(event, labels.length);
      return;
    }

    const composer =
      wrapperRef.current?.querySelector<HTMLDivElement>(COMPOSER_SELECTOR);
    if (
      event.key === KEY_ARROW_UP &&
      composer &&
      target === composer &&
      isContentEmpty(composer)
    ) {
      event.preventDefault();
      focusPill(0);
    }
  };

  return {
    labels,
    activeIndex,
    wrapperRef,
    railRef,
    pillRefs,
    select,
    setActiveIndex,
    onKeyDownCapture,
  };
}
