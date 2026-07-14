import posthog from "posthog-js";

const POSTHOG_HOST = "https://us.i.posthog.com";
const MAX_PENDING_EVENTS = 25;

type AnalyticsState = "pending" | "enabled" | "disabled";

let state: AnalyticsState = "pending";
const pendingEvents: Array<{
  event: string;
  properties: Record<string, string | number | boolean | undefined>;
}> = [];

export const initializeAnalytics = (clientKey: string): boolean => {
  const normalizedKey = clientKey.trim();
  if (!normalizedKey || state === "enabled" || typeof window === "undefined") {
    return state === "enabled";
  }

  posthog.init(normalizedKey, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageleave: false,
    capture_pageview: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
  });
  state = "enabled";
  for (const pendingEvent of pendingEvents.splice(0)) {
    posthog.capture(pendingEvent.event, pendingEvent.properties);
  }
  return true;
};

export const disableAnalytics = (): void => {
  if (state !== "enabled") {
    state = "disabled";
    pendingEvents.length = 0;
  }
};

export const identifyAnalyticsUser = (
  distinctId: string,
  properties: Record<string, string | boolean | undefined>,
): void => {
  if (state !== "enabled") {
    return;
  }
  posthog.identify(distinctId, properties);
};

export const groupAnalyticsOrganization = (organizationId: string): void => {
  if (state !== "enabled") {
    return;
  }
  posthog.group("organization", organizationId);
};

export const resetAnalytics = (): void => {
  if (state !== "enabled") {
    return;
  }
  posthog.reset();
};

export const captureAnalyticsEvent = (
  event: string,
  properties: Record<string, string | number | boolean | undefined>,
): void => {
  if (state === "pending") {
    if (pendingEvents.length === MAX_PENDING_EVENTS) {
      pendingEvents.shift();
    }
    pendingEvents.push({ event, properties });
    return;
  }
  if (state !== "enabled") {
    return;
  }
  posthog.capture(event, properties);
};
