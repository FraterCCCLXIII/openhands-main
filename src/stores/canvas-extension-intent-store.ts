import type { CanvasExtensionIntent } from "#/types/canvas-extension";

/**
 * Owns the hand-off from the New Chat menu to an extension page. Non-persisted
 * on purpose: an intent is consumed once, so a later plain visit never replays
 * it. A page that is mounted and listening gets it through `onIntent`;
 * otherwise it waits for the page's next mount.
 */

/** A pending intent older than this belongs to a navigation that never landed. */
const PENDING_INTENT_TTL_MS = 10_000;

type IntentListener = (intent: CanvasExtensionIntent) => void;

const pending = new Map<string, CanvasExtensionIntent>();
const listeners = new Map<string, Set<IntentListener>>();
const mountedPages = new Map<string, number>();

const pageKey = (extensionName: string, pageId: string) =>
  `${extensionName}\u0000${pageId}`;

/** Delivers an intent to a mounted, listening page or keeps it for the next mount. */
export function dispatchCanvasExtensionIntent(
  extensionName: string,
  pageId: string,
  request: Pick<CanvasExtensionIntent, "id" | "action">,
): void {
  const intent: CanvasExtensionIntent = { ...request, at: Date.now() };
  const subscribers = listeners.get(extensionName);
  const key = pageKey(extensionName, pageId);
  if ((mountedPages.get(key) ?? 0) > 0 && subscribers?.size) {
    pending.delete(key);
    [...subscribers].forEach((listener) => {
      try {
        listener(intent);
      } catch (error) {
        console.error("Canvas Extension intent handler failed", error);
      }
    });
    return;
  }
  pending.set(key, intent);
}

/**
 * Reads the page's pending intent without clearing it, so a remount in the same
 * tick (React Strict Mode) still sees it; stale intents are ignored.
 */
export function peekCanvasExtensionIntent(
  extensionName: string,
  pageId: string,
  now: number = Date.now(),
): CanvasExtensionIntent | null {
  const intent = pending.get(pageKey(extensionName, pageId)) ?? null;
  if (!intent || now - intent.at > PENDING_INTENT_TTL_MS) return null;
  return intent;
}

/** Clears the page's pending intent once the page has been handed it. */
export function clearCanvasExtensionIntent(
  extensionName: string,
  pageId: string,
): void {
  pending.delete(pageKey(extensionName, pageId));
}

/** Subscribes an extension to intents for its already-mounted pages. */
export function subscribeCanvasExtensionIntents(
  extensionName: string,
  listener: IntentListener,
): () => void {
  const set = listeners.get(extensionName) ?? new Set<IntentListener>();
  set.add(listener);
  listeners.set(extensionName, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(extensionName);
  };
}

/** Marks a page mounted so intents go to `onIntent`; returns the unmark. */
export function markCanvasExtensionPageMounted(
  extensionName: string,
  pageId: string,
): () => void {
  const key = pageKey(extensionName, pageId);
  mountedPages.set(key, (mountedPages.get(key) ?? 0) + 1);
  return () => {
    const count = (mountedPages.get(key) ?? 1) - 1;
    if (count <= 0) mountedPages.delete(key);
    else mountedPages.set(key, count);
  };
}

/** Test seam: forget every pending intent, subscriber, and mounted page. */
export function resetCanvasExtensionIntents(): void {
  pending.clear();
  listeners.clear();
  mountedPages.clear();
}
