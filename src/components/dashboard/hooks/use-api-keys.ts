import { useEffect, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import {
  copyTextToClipboard,
  maskApiKey,
  maskStoredApiKey,
} from "@/src/components/dashboard/utils";
import type {
  AdminApiKeyStatus,
  UserApiKeyStatus,
} from "@/src/types/context-layer";

interface AgentApiKeyResponse {
  ownerId: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface UserApiKeyResponse {
  hasKey: boolean;
  key: UserApiKeyStatus | null;
  apiKey: string | null;
}

interface AdminApiKeyResponse {
  hasKey: boolean;
  key: AdminApiKeyStatus | null;
  apiKey: string | null;
}

const useCopiedFlag = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  return { copied, setCopied };
};

interface StoredApiKeyHookOptions<TStatus extends { keyPrefix: string; keySuffix: string }> {
  initialStatus: TStatus | null;
  initialValue: string | null;
  fetchUrl: string;
  unavailableMessage: string;
  regenerateMessage: string;
  createMessage: string;
  onStatus: (message: string) => void;
}

const useStoredApiKey = <TStatus extends { keyPrefix: string; keySuffix: string }>({
  initialStatus,
  initialValue,
  fetchUrl,
  unavailableMessage,
  regenerateMessage,
  createMessage,
  onStatus,
}: StoredApiKeyHookOptions<TStatus>) => {
  const [status, setStatus] = useState<TStatus | null>(initialStatus);
  const [value, setValue] = useState(initialValue ?? "");
  const [revealed, setRevealed] = useState(false);
  const { copied, setCopied } = useCopiedFlag();

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  const rotateKey = async (hadKey: boolean) => {
    const rotated = await fetchJson<{
      apiKey: string;
      key: TStatus;
    }>(fetchUrl, {
      method: "POST",
    });

    setStatus(rotated.key);
    setValue(rotated.apiKey);
    setRevealed(true);
    setCopied(false);
    onStatus(hadKey ? regenerateMessage : createMessage);
    return rotated.apiKey;
  };

  const ensureValue = async () => {
    const currentValue = value.trim();
    if (currentValue) {
      return currentValue;
    }

    const current = await fetchJson<{
      hasKey: boolean;
      key: TStatus | null;
      apiKey: string | null;
    }>(fetchUrl, {
      cache: "no-store",
    });
    setStatus(current.key);

    if (current.apiKey) {
      setValue(current.apiKey);
      return current.apiKey;
    }

    return rotateKey(current.hasKey);
  };

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }

    try {
      await ensureValue();
      setRevealed(true);
    } catch {
      setRevealed(false);
      onStatus(unavailableMessage);
    }
  };

  const handleCopy = async () => {
    try {
      const fullApiKey = await ensureValue();
      await copyTextToClipboard(fullApiKey);
      setCopied(true);
    } catch {
      setCopied(false);
      onStatus("Unable to copy the API key from this browser session.");
    }
  };

  const handleRotate = async () => {
    try {
      await rotateKey(status !== null);
    } catch {
      onStatus(unavailableMessage);
    }
  };

  return {
    hasKey: status !== null,
    status,
    value,
    revealed,
    copied,
    maskedValue: value
      ? maskApiKey(value, revealed)
      : status
        ? maskStoredApiKey(status.keyPrefix, status.keySuffix)
        : "",
    handleReveal,
    handleCopy,
    handleRotate,
  };
};

interface UseDashboardApiKeysOptions {
  contextApiKey: string;
  userApiKey: UserApiKeyStatus | null;
  userApiKeyValue?: string | null;
  adminApiKey: AdminApiKeyStatus | null;
  adminApiKeyValue?: string | null;
  onStatus: (message: string) => void;
}

export const useApiKeys = ({
  contextApiKey,
  userApiKey,
  userApiKeyValue = null,
  adminApiKey,
  adminApiKeyValue = null,
  onStatus,
}: UseDashboardApiKeysOptions) => {
  const [agentApiKey, setAgentApiKey] = useState(contextApiKey);
  const [hasLocalAgentKeyOverride, setHasLocalAgentKeyOverride] = useState(false);
  const [revealAgentKey, setRevealAgentKey] = useState(false);
  const { copied: agentKeyCopied, setCopied: setAgentKeyCopied } = useCopiedFlag();

  useEffect(() => {
    if (!hasLocalAgentKeyOverride) {
      setAgentApiKey(contextApiKey);
      return;
    }

    if (contextApiKey && contextApiKey === agentApiKey) {
      setHasLocalAgentKeyOverride(false);
    }
  }, [agentApiKey, contextApiKey, hasLocalAgentKeyOverride]);

  const contextApiReady = agentApiKey.trim().length > 0;

  const userKey = useStoredApiKey<UserApiKeyStatus>({
    initialStatus: userApiKey,
    initialValue: userApiKeyValue,
    fetchUrl: "/api/user/key",
    unavailableMessage: "Unable to load the full user automation key right now.",
    regenerateMessage:
      "Regenerated your user automation key so the full value can be shown again. Update any existing clients using the previous key.",
    createMessage:
      "Created a new user automation key. Save it somewhere secure because the full value is only shown when you explicitly reveal or copy it.",
    onStatus,
  });

  const adminKey = useStoredApiKey<AdminApiKeyStatus>({
    initialStatus: adminApiKey,
    initialValue: adminApiKeyValue,
    fetchUrl: "/api/admin/key",
    unavailableMessage: "Unable to load the full admin automation key right now.",
    regenerateMessage:
      "Regenerated your admin automation key so the full value can be shown again. Update any existing clients using the previous key.",
    createMessage:
      "Created a new admin automation key. Save it somewhere secure because the full value is only shown when you explicitly reveal or copy it.",
    onStatus,
  });

  const handleCopyAgentKey = async () => {
    if (!contextApiReady) {
      onStatus("The agent key is not available yet.");
      return;
    }

    try {
      await copyTextToClipboard(agentApiKey);
      setAgentKeyCopied(true);
    } catch {
      setAgentKeyCopied(false);
      onStatus("Unable to copy the API key from this browser session.");
    }
  };

  const handleRotateAgentKey = async () => {
    try {
      const rotated = await fetchJson<AgentApiKeyResponse>("/api/user/agent-key", {
        method: "POST",
      });
      setAgentApiKey(rotated.apiKey);
      setHasLocalAgentKeyOverride(true);
      setRevealAgentKey(true);
      setAgentKeyCopied(false);
      onStatus(
        "Rotated your agent key. Update any existing agents or clients using the previous key.",
      );
    } catch {
      onStatus("Unable to rotate the agent key right now.");
    }
  };

  return {
    contextApiReady,
    agentKey: {
      copied: agentKeyCopied,
      revealed: revealAgentKey,
      maskedValue: maskApiKey(agentApiKey, revealAgentKey),
      toggleReveal: () => setRevealAgentKey((current) => !current),
      handleCopy: handleCopyAgentKey,
      handleRotate: handleRotateAgentKey,
    },
    userKey,
    adminKey,
  };
};

export type { AgentApiKeyResponse, AdminApiKeyResponse, UserApiKeyResponse };
