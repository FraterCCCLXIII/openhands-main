# PostHog analytics

Set `INTHUB_POSTHOG_CLIENT_KEY` on the backend runtime to enable product
analytics. The browser reads the public project key from `/api/auth/config`;
when it is unset, all tracking calls are no-ops.

The client disables autocapture, page-view capture, page-leave capture, and
session recording. Events are identified with the stable OpenHands Cloud user
ID and grouped by organization ID. Event properties must not contain API keys,
OAuth tokens, connector URLs, integration or resource names, raw errors, or
query strings.

## Events

| Event | Captured after |
| --- | --- |
| `integrations_hub_viewed` | The initial integrations query resolves |
| `integration_setup_started` | The add-integration wizard is opened |
| `integration_oauth_started` | The OAuth start endpoint returns a redirect |
| `integration_oauth_completed` | The OAuth callback returns to the dashboard |
| `integration_tools_discovered` | Tool discovery succeeds |
| `integration_created` | An integration is saved |
| `integration_setup_failed` | OAuth start/callback, discovery, or creation fails |
| `integration_state_changed` | An integration or tool access mode is updated |
| `unused_tools_disabled` | The bulk unused-tool action succeeds |
| `access_request_resolved` | One or more approval requests are resolved |
| `agent_connection_copied` | A connection artifact is copied successfully |

The typed property contract lives in `src/hooks/use-tracking.ts` and all event
calls flow through that hook.
