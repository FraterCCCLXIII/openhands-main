import type { ReactNode } from "react";

import { ConnectionCodeExample } from "@/src/components/agent-connection/connection-code-example";
import { SettingsInput } from "@/src/components/settings/settings-input";
import { AGENT_CONNECTION_PAGE_COPY } from "@/src/constants/agent-connection-page";

function ConnectionDetailSubsection({
  title,
  description,
  children,
  testId,
}: {
  title: string;
  description: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <section
      data-testid={testId}
      className="flex flex-col gap-4 border-t border-[var(--oh-border)] pt-6 first:border-t-0 first:pt-0"
    >
      <div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-tertiary-light">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export interface AgentConnectionDetailsContentProps {
  adminPromptExample?: string;
  adminSchemaEndpoint?: string;
  agentMcpConfigExample: string;
  agentMcpEndpoint: string;
  agentMcpToolName: string;
  agentOpenApiSchemaEndpoint: string;
  agentRestPromptExample: string;
  isAdmin: boolean;
  userOpenApiSchemaEndpoint: string;
  userRestPromptExample: string;
}

export function AgentConnectionDetailsContent({
  adminPromptExample,
  adminSchemaEndpoint,
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  isAdmin,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
}: AgentConnectionDetailsContentProps) {
  return (
    <div
      data-testid="agent-connection-details-content"
      className="flex flex-col"
    >
      <p className="text-sm leading-5 text-tertiary-light">
        {AGENT_CONNECTION_PAGE_COPY.connectionDetailsDescription}
      </p>

      <div className="mt-4 flex flex-col">
        <ConnectionDetailSubsection
          testId="agent-connection-mcp-section"
          title={AGENT_CONNECTION_PAGE_COPY.agentMcpTitle}
          description={AGENT_CONNECTION_PAGE_COPY.agentMcpDescription}
        >
          <SettingsInput
            testId="agent-connection-mcp-endpoint"
            label={AGENT_CONNECTION_PAGE_COPY.endpointLabel}
            value={agentMcpEndpoint}
            isDisabled
          />
          <SettingsInput
            testId="agent-connection-mcp-example-tool"
            label={AGENT_CONNECTION_PAGE_COPY.exampleToolLabel}
            value={agentMcpToolName}
            isDisabled
          />
          <ConnectionCodeExample
            label={AGENT_CONNECTION_PAGE_COPY.mcpConfigExampleTitle}
          >
            {agentMcpConfigExample}
          </ConnectionCodeExample>
        </ConnectionDetailSubsection>

        <ConnectionDetailSubsection
          testId="agent-connection-agent-rest-section"
          title={AGENT_CONNECTION_PAGE_COPY.agentRestApiTitle}
          description={AGENT_CONNECTION_PAGE_COPY.agentRestApiDescription}
        >
          <SettingsInput
            testId="agent-connection-agent-openapi"
            label={AGENT_CONNECTION_PAGE_COPY.openapiSchemaLabel}
            value={agentOpenApiSchemaEndpoint}
            isDisabled
          />
          <ConnectionCodeExample
            label={AGENT_CONNECTION_PAGE_COPY.exampleAgentPromptTitle}
          >
            {agentRestPromptExample}
          </ConnectionCodeExample>
        </ConnectionDetailSubsection>

        <ConnectionDetailSubsection
          testId="agent-connection-user-rest-section"
          title={AGENT_CONNECTION_PAGE_COPY.userRestApiTitle}
          description={AGENT_CONNECTION_PAGE_COPY.userRestApiDescription}
        >
          <SettingsInput
            testId="agent-connection-user-openapi"
            label={AGENT_CONNECTION_PAGE_COPY.openapiSchemaLabel}
            value={userOpenApiSchemaEndpoint}
            isDisabled
          />
          <ConnectionCodeExample
            label={AGENT_CONNECTION_PAGE_COPY.exampleAgentPromptTitle}
          >
            {userRestPromptExample}
          </ConnectionCodeExample>
        </ConnectionDetailSubsection>

        {isAdmin && adminPromptExample && adminSchemaEndpoint ? (
          <ConnectionDetailSubsection
            testId="agent-connection-admin-rest-section"
            title={AGENT_CONNECTION_PAGE_COPY.adminRestApiTitle}
            description={AGENT_CONNECTION_PAGE_COPY.adminRestApiDescription}
          >
            <SettingsInput
              testId="agent-connection-admin-openapi"
              label={AGENT_CONNECTION_PAGE_COPY.openapiSchemaLabel}
              value={adminSchemaEndpoint}
              isDisabled
            />
            <ConnectionCodeExample
              label={AGENT_CONNECTION_PAGE_COPY.exampleAgentPromptTitle}
            >
              {adminPromptExample}
            </ConnectionCodeExample>
          </ConnectionDetailSubsection>
        ) : null}
      </div>
    </div>
  );
}
