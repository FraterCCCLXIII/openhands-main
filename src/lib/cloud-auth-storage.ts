"use client";

const TOKEN_STORAGE_KEY = "integrations-hub-openhands-token";
const AUTH_CHANGE_EVENT = "integrations-hub-auth-change";

const browserStorage = () =>
  typeof window === "undefined" ? null : window.localStorage;

export function getStoredOpenHandsToken(): string | null {
  return browserStorage()?.getItem(TOKEN_STORAGE_KEY)?.trim() || null;
}

export function setStoredOpenHandsToken(token: string): void {
  const normalized = token.trim();
  if (!normalized) {
    clearStoredOpenHandsToken();
    return;
  }
  browserStorage()?.setItem(TOKEN_STORAGE_KEY, normalized);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearStoredOpenHandsToken(): void {
  browserStorage()?.removeItem(TOKEN_STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function subscribeToOpenHandsTokenChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_STORAGE_KEY) listener();
  };

  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
