import { uiPath } from "@/src/shared/paths";

export const mainAppLoginPath = (returnTo = uiPath("/integrations")) =>
  `/login?returnTo=${encodeURIComponent(returnTo)}`;

export function currentBrowserPath(): string {
  if (typeof window === "undefined") return uiPath("/integrations");
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function redirectToMainAppLogin(returnTo = currentBrowserPath()): void {
  window.location.replace(mainAppLoginPath(returnTo));
}

export async function logoutViaMainApp(): Promise<void> {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    window.location.assign("/login");
  }
}
