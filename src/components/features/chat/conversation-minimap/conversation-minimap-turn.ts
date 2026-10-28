export function isConversationTurnInDom(userEventId: string): boolean {
  return !!document.querySelector(
    `[data-conversation-turn-id="${CSS.escape(userEventId)}"]`,
  );
}

export function scrollToConversationTurn(
  scrollContainer: HTMLElement | null,
  userEventId: string,
): void {
  const turn = document.querySelector(
    `[data-conversation-turn-id="${CSS.escape(userEventId)}"]`,
  );
  if (!(turn instanceof HTMLElement) || !scrollContainer) {
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const turnRect = turn.getBoundingClientRect();
  const nextScrollTop =
    scrollContainer.scrollTop + (turnRect.top - containerRect.top) - 24;
  scrollContainer.scrollTo({
    top: Math.max(0, nextScrollTop),
    behavior: "smooth",
  });
}

export function waitForConversationTurnInDom(
  userEventId: string,
  options: { timeoutMs?: number } = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 3000;
  const started = performance.now();

  return new Promise((resolve) => {
    const tick = () => {
      if (isConversationTurnInDom(userEventId)) {
        resolve(true);
        return;
      }
      if (performance.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

interface NavigateToConversationTurnOptions {
  loadOlder: () => Promise<void>;
  isEventInStore: (userEventId: string) => boolean;
  getEventCount: () => number;
  maxPages?: number;
}

/**
 * Scroll to a user turn, loading older chat pages first when the turn is not
 * yet rendered (lazy history backfill).
 *
 * @spec MM-002 — Jump-to-turn loads chat pages on demand, and only then.
 * Do not start a second full-history walk. Cloud callers should pass
 * `strictPagination: true` through `loadOlder` once that option is wired.
 * See specs/conversation-minimap.md.
 */
export async function navigateToConversationTurn(
  scrollContainer: HTMLElement | null,
  userEventId: string,
  options: NavigateToConversationTurnOptions,
): Promise<boolean> {
  if (!scrollContainer) {
    return false;
  }

  if (isConversationTurnInDom(userEventId)) {
    scrollToConversationTurn(scrollContainer, userEventId);
    return true;
  }

  const maxPages = options.maxPages ?? 200;

  for (let page = 0; page < maxPages; page += 1) {
    if (isConversationTurnInDom(userEventId)) {
      scrollToConversationTurn(scrollContainer, userEventId);
      return true;
    }

    if (options.isEventInStore(userEventId)) {
      const appeared = await waitForConversationTurnInDom(userEventId);
      if (appeared) {
        scrollToConversationTurn(scrollContainer, userEventId);
        return true;
      }
      break;
    }

    const eventCountBefore = options.getEventCount();
    await options.loadOlder();

    if (isConversationTurnInDom(userEventId)) {
      scrollToConversationTurn(scrollContainer, userEventId);
      return true;
    }

    if (options.isEventInStore(userEventId)) {
      const appeared = await waitForConversationTurnInDom(userEventId);
      if (appeared) {
        scrollToConversationTurn(scrollContainer, userEventId);
        return true;
      }
      break;
    }

    if (options.getEventCount() === eventCountBefore) {
      break;
    }
  }

  const appeared = await waitForConversationTurnInDom(userEventId, {
    timeoutMs: 500,
  });
  if (appeared) {
    scrollToConversationTurn(scrollContainer, userEventId);
    return true;
  }

  return false;
}
