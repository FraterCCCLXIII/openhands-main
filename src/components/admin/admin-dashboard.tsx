"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, KeyRound, PlugZap, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { useAdminStore } from "@/src/stores/admin-store";
import type { AccessRequest, IntegrationSpec, NotificationRecord } from "@/src/types/context-layer";

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseJson = (value: string) => {
  if (!value.trim()) {
    return {} as Record<string, unknown>;
  }

  return JSON.parse(value) as Record<string, unknown>;
};

const fetchJson = async <T,>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

interface AdminDashboardProps {
  initialIntegrations: IntegrationSpec[];
  initialAccessRequests: AccessRequest[];
  initialNotifications: NotificationRecord[];
  currentUser: { name?: string | null; email?: string | null };
}

export const AdminDashboard = ({
  initialIntegrations,
  initialAccessRequests,
  initialNotifications,
  currentUser,
}: AdminDashboardProps) => {
  const queryClient = useQueryClient();
  const { providerFilter, requestFilter, setProviderFilter, setRequestFilter } = useAdminStore();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [integrationForm, setIntegrationForm] = useState({
    key: "",
    name: "",
    kind: "api",
    provider: "composio",
    authStrategy: "oauth2",
    configJson: '{"defaultToolSlug":""}',
    credentialsJson: "{}",
  });
  const [functionForm, setFunctionForm] = useState({
    integrationKey: initialIntegrations[0]?.key ?? "",
    name: "",
    description: "",
    defaultScopes: "",
    executionMode: "provider",
    configJson: "{}",
    mockResponseJson: '{}',
  });
  const [policyForm, setPolicyForm] = useState({
    agentClass: "researcher",
    integrationKey: initialIntegrations[0]?.key ?? "",
    functionNames: "",
    scopes: "",
  });

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
  });

  const accessRequestsQuery = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<AccessRequest[]>("/api/access-requests"),
    initialData: initialAccessRequests,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchJson<NotificationRecord[]>("/api/notifications"),
    initialData: initialNotifications,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async ({ url, method, body }: { url: string; method: string; body?: unknown }) =>
      fetchJson(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: async () => {
      setStatusMessage("Saved.");
      await invalidateAll();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const integrations = integrationsQuery.data ?? [];
  const accessRequests = accessRequestsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const filteredIntegrations = useMemo(() => {
    if (providerFilter === "all") {
      return integrations;
    }

    return integrations.filter((integration) => integration.provider === providerFilter);
  }, [integrations, providerFilter]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") {
      return accessRequests;
    }

    return accessRequests.filter((item) => item.status === requestFilter);
  }, [accessRequests, requestFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-workspace)] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Context Layer dashboard</h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            Signed in as {currentUser.email ?? currentUser.name ?? "admin"}. Manage connectors, policies, approvals, and notifications from one place.
          </p>
        </div>
        <Button variant="secondary" onClick={() => signOut({ redirectTo: "/" })}>
          Sign out
        </Button>
      </header>

      {statusMessage ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-active)]">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <PlugZap className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-white">Add integration</h2>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              actionMutation.mutate({
                url: "/api/integrations",
                method: "POST",
                body: {
                  key: integrationForm.key,
                  name: integrationForm.name,
                  kind: integrationForm.kind,
                  provider: integrationForm.provider,
                  authStrategy: integrationForm.authStrategy,
                  enabled: true,
                  fineGrainedPermissions: true,
                  config: parseJson(integrationForm.configJson),
                  credentials: parseJson(integrationForm.credentialsJson),
                },
              });
            }}
          >
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="integration key" value={integrationForm.key} onChange={(event) => setIntegrationForm({ ...integrationForm, key: event.target.value })} />
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="display name" value={integrationForm.name} onChange={(event) => setIntegrationForm({ ...integrationForm, name: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={integrationForm.kind} onChange={(event) => setIntegrationForm({ ...integrationForm, kind: event.target.value })}>
                <option value="api">API</option>
                <option value="mcp">MCP</option>
              </select>
              <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={integrationForm.provider} onChange={(event) => setIntegrationForm({ ...integrationForm, provider: event.target.value })}>
                <option value="composio">Composio</option>
                <option value="mcp">MCP SDK</option>
                <option value="mock">Mock</option>
              </select>
            </div>
            <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={integrationForm.authStrategy} onChange={(event) => setIntegrationForm({ ...integrationForm, authStrategy: event.target.value })}>
              <option value="oauth2">oauth2</option>
              <option value="api_key">api_key</option>
              <option value="bearer">bearer</option>
              <option value="basic">basic</option>
              <option value="mcp_session">mcp_session</option>
              <option value="none">none</option>
            </select>
            <textarea className="min-h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder='{"serverUrl":"https://..."}' value={integrationForm.configJson} onChange={(event) => setIntegrationForm({ ...integrationForm, configJson: event.target.value })} />
            <textarea className="min-h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder='{"connectedAccountId":"acct_..."}' value={integrationForm.credentialsJson} onChange={(event) => setIntegrationForm({ ...integrationForm, credentialsJson: event.target.value })} />
            <Button type="submit">Create integration</Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <ToggleRight className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-white">Add function</h2>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              actionMutation.mutate({
                url: `/api/integrations/${functionForm.integrationKey}/functions`,
                method: "POST",
                body: {
                  name: functionForm.name,
                  description: functionForm.description,
                  enabled: true,
                  fineGrainedPermissions: true,
                  defaultScopes: parseCsv(functionForm.defaultScopes),
                  executionMode: functionForm.executionMode,
                  config: parseJson(functionForm.configJson),
                  mockResponse: parseJson(functionForm.mockResponseJson),
                },
              });
            }}
          >
            <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={functionForm.integrationKey} onChange={(event) => setFunctionForm({ ...functionForm, integrationKey: event.target.value })}>
              <option value="">Select integration</option>
              {integrations.map((integration) => (
                <option key={integration.key} value={integration.key}>{integration.name}</option>
              ))}
            </select>
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="function name" value={functionForm.name} onChange={(event) => setFunctionForm({ ...functionForm, name: event.target.value })} />
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="description" value={functionForm.description} onChange={(event) => setFunctionForm({ ...functionForm, description: event.target.value })} />
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="scopes (comma separated)" value={functionForm.defaultScopes} onChange={(event) => setFunctionForm({ ...functionForm, defaultScopes: event.target.value })} />
            <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={functionForm.executionMode} onChange={(event) => setFunctionForm({ ...functionForm, executionMode: event.target.value })}>
              <option value="provider">Provider</option>
              <option value="mock">Mock</option>
            </select>
            <textarea className="min-h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder='{"composioToolSlug":"GMAIL_FETCH_EMAILS"}' value={functionForm.configJson} onChange={(event) => setFunctionForm({ ...functionForm, configJson: event.target.value })} />
            <textarea className="min-h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder='{"preview":"hello"}' value={functionForm.mockResponseJson} onChange={(event) => setFunctionForm({ ...functionForm, mockResponseJson: event.target.value })} />
            <Button type="submit">Create function</Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-white">Agent-class policy</h2>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              actionMutation.mutate({
                url: `/api/agent-classes/${policyForm.agentClass}`,
                method: "PUT",
                body: {
                  rules: [
                    {
                      integrationKey: policyForm.integrationKey,
                      functionNames: parseCsv(policyForm.functionNames),
                      scopes: parseCsv(policyForm.scopes),
                      enabled: true,
                    },
                  ],
                },
              });
            }}
          >
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="agent class" value={policyForm.agentClass} onChange={(event) => setPolicyForm({ ...policyForm, agentClass: event.target.value })} />
            <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={policyForm.integrationKey} onChange={(event) => setPolicyForm({ ...policyForm, integrationKey: event.target.value })}>
              <option value="">Select integration</option>
              {integrations.map((integration) => (
                <option key={integration.key} value={integration.key}>{integration.name}</option>
              ))}
            </select>
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="function names (comma separated)" value={policyForm.functionNames} onChange={(event) => setPolicyForm({ ...policyForm, functionNames: event.target.value })} />
            <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" placeholder="scopes (comma separated)" value={policyForm.scopes} onChange={(event) => setPolicyForm({ ...policyForm, scopes: event.target.value })} />
            <Button type="submit">Save policy</Button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Integrations & functions</h2>
              <p className="text-sm text-[var(--color-text-base)]">Reusing the OpenHands KPI-tracker dark card language for the admin workspace.</p>
            </div>
            <select className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              <option value="all">All providers</option>
              {[...new Set(integrations.map((integration) => integration.provider))].map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4">
            {filteredIntegrations.map((integration) => (
              <div key={integration.key} className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                      <Badge>{integration.provider}</Badge>
                      <Badge>{integration.kind}</Badge>
                      <Badge tone={integration.enabled ? "success" : "danger"}>{integration.enabled ? "enabled" : "disabled"}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-base)]">{integration.key} · auth: {integration.authStrategy}</p>
                  </div>
                  <Button
                    variant={integration.enabled ? "secondary" : "primary"}
                    className="gap-2"
                    onClick={() => actionMutation.mutate({ url: `/api/integrations/${integration.key}/toggle`, method: "POST", body: { enabled: !integration.enabled } })}
                  >
                    {integration.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {integration.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
                <div className="grid gap-3">
                  {Object.values(integration.functions).length === 0 ? (
                    <p className="text-sm text-[var(--color-text-base)]">No functions registered yet.</p>
                  ) : (
                    Object.values(integration.functions).map((functionSpec) => (
                      <div key={functionSpec.name} className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">{functionSpec.name}</p>
                            <Badge tone={functionSpec.enabled ? "success" : "danger"}>{functionSpec.enabled ? "enabled" : "disabled"}</Badge>
                          </div>
                          <p className="text-sm text-[var(--color-text-base)]">{functionSpec.description || "No description provided."}</p>
                          <p className="mt-2 text-xs text-[var(--color-text-base)]">Scopes: {functionSpec.defaultScopes.join(", ") || "none"}</p>
                        </div>
                        <Button
                          variant={functionSpec.enabled ? "secondary" : "primary"}
                          onClick={() => actionMutation.mutate({ url: `/api/integrations/${integration.key}/functions/${functionSpec.name}/toggle`, method: "POST", body: { enabled: !functionSpec.enabled } })}
                        >
                          {functionSpec.enabled ? "Disable function" : "Enable function"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="text-xl font-semibold text-white">Access requests</h2>
            </div>
            <select className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white" value={requestFilter} onChange={(event) => setRequestFilter(event.target.value as "all" | "pending" | "approved" | "rejected") }>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-[var(--color-text-base)]">No access requests yet.</p>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{request.integrationKey}.{request.functionName}</p>
                      <Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>{request.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-text-base)]">{request.agentId} ({request.agentClass}) requested {request.scopes.join(", ") || "default scopes"} for {request.requestedMinutes} minutes.</p>
                    {request.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => actionMutation.mutate({ url: `/api/access-requests/${request.id}/approve`, method: "POST", body: { approver: currentUser.email ?? "admin", durationMinutes: request.requestedMinutes } })}>Approve</Button>
                        <Button variant="danger" onClick={() => actionMutation.mutate({ url: `/api/access-requests/${request.id}/reject`, method: "POST", body: { approver: currentUser.email ?? "admin" } })}>Reject</Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="text-xl font-semibold text-white">Recent notifications</h2>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-[var(--color-text-base)]">Notifications will appear here when agents request access.</p>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{notification.channel}</Badge>
                      <span className="text-sm font-medium text-white">{notification.recipient}</span>
                    </div>
                    <p className="mt-2 text-sm text-white">{notification.subject}</p>
                    <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">{notification.body}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
