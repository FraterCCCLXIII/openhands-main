export const DEFAULT_AGENT_ID = "research-bot-01";
export const DEFAULT_AGENT_CLASS = "researcher";

const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const resolveInvocationIdentity = ({
  agentId,
  agentClass,
}: {
  agentId?: string | null;
  agentClass?: string | null;
}) => ({
  agentId: normalizeOptionalString(agentId) ?? DEFAULT_AGENT_ID,
  agentClass: normalizeOptionalString(agentClass) ?? DEFAULT_AGENT_CLASS,
});
