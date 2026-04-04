export const normalizeAgentIdentityValue = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const resolveInvocationIdentity = ({
  agentId,
  agentClass,
}: {
  agentId?: string | null;
  agentClass?: string | null;
}) => ({
  agentId: normalizeAgentIdentityValue(agentId),
  agentClass: normalizeAgentIdentityValue(agentClass),
});
