"use client";

import { useCallback } from "react";

import { captureAnalyticsEvent } from "@/src/lib/analytics";

export interface AnalyticsEventProperties {
  integrations_hub_viewed: {
    integration_count: number;
    enabled_integration_count: number;
    tool_count: number;
  };
  integration_setup_started: {
    source: "catalog" | "manual";
    connector_slug?: string;
  };
  integration_oauth_started: {
    connector_slug: string;
    action: "connect" | "reconnect";
  };
  integration_oauth_completed: {
    connector_slug?: string;
    outcome: "connected" | "error";
  };
  integration_tools_discovered: {
    integration_kind: "managed" | "mcp";
    connector_slug?: string;
    auth_strategy?: string;
    tool_count: number;
  };
  integration_created: {
    integration_kind: "api" | "mcp";
    connector_slug?: string;
    auth_strategy: string;
    tool_count: number;
    enabled_tool_count: number;
    approval_required_tool_count: number;
  };
  integration_setup_failed: {
    stage: "oauth_start" | "oauth_callback" | "discovery" | "create";
    integration_kind?: "managed" | "mcp";
    connector_slug?: string;
  };
  agent_connection_copied: {
    artifact_type:
      | "mcp_endpoint"
      | "mcp_tool_name"
      | "mcp_config"
      | "agent_openapi_schema"
      | "agent_prompt"
      | "user_openapi_schema"
      | "user_prompt"
      | "admin_openapi_schema"
      | "admin_prompt";
  };
  integration_state_changed: {
    action: "enabled" | "disabled" | "deleted" | "tool_access_changed";
    integration_kind: "api" | "mcp";
    auth_strategy: string;
  };
  unused_tools_disabled: {
    integration_count: number;
    tool_count: number;
  };
  access_request_resolved: {
    decision: "approved" | "rejected";
    request_count: number;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventProperties;

export const safeAnalyticsIdentifier = (
  value: string | null | undefined,
): string | undefined => {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized)
    ? normalized
    : undefined;
};

export const useTracking = () => {
  const track = useCallback(
    <EventName extends AnalyticsEventName>(
      event: EventName,
      properties: AnalyticsEventProperties[EventName],
    ) => {
      captureAnalyticsEvent(event, properties);
    },
    [],
  );

  return { track };
};
