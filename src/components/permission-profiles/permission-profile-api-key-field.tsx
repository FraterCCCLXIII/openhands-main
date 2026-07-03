"use client";

import { useEffect, useState } from "react";

import { ApiKeyField } from "@/src/components/settings/api-key-field";
import {
  copyTextToClipboard,
  maskApiKey,
} from "@/src/components/dashboard/utils";
import { permissionProfileLabel } from "@/src/components/permission-profiles/permission-profile-utils";
import { fetchJson } from "@/src/lib/fetch-json";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface PermissionProfileApiKeyFieldProps {
  profile: PermissionProfile;
  className?: string;
}

export function PermissionProfileApiKeyField({
  profile,
  className,
}: PermissionProfileApiKeyFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [agentApiKey, setAgentApiKey] = useState(
    profile.agentApiKey?.trim() ?? "",
  );
  const [keyActionPending, setKeyActionPending] = useState(false);
  const hasKey = agentApiKey.length > 0;
  const label = permissionProfileLabel(profile);

  useEffect(() => {
    setAgentApiKey(profile.agentApiKey?.trim() ?? "");
    setRevealed(false);
  }, [profile.agentApiKey, profile.id]);

  const displayedValue = hasKey
    ? maskApiKey(agentApiKey, revealed)
    : "No agent key provisioned yet";

  const handleCopy = async () => {
    if (!hasKey) return;
    await copyTextToClipboard(agentApiKey);
  };

  const handleRotate = async () => {
    if (keyActionPending) return;

    setKeyActionPending(true);
    try {
      const updatedProfile = await fetchJson<PermissionProfile>(
        `/api/permission-profiles/${profile.id}/agent-key`,
        { method: "POST" },
      );
      const nextKey = updatedProfile.agentApiKey?.trim() ?? "";
      setAgentApiKey(nextKey);
      setRevealed(nextKey.length > 0);
    } finally {
      setKeyActionPending(false);
    }
  };

  return (
    <ApiKeyField
      value={displayedValue}
      isRevealed={revealed}
      onToggleReveal={() => setRevealed((current) => !current)}
      onCopy={handleCopy}
      onRotate={handleRotate}
      copyAriaLabel={`Copy ${label.toLowerCase()} agent key`}
      rotateAriaLabel={
        hasKey
          ? `Rotate ${label.toLowerCase()} agent key`
          : `Provision ${label.toLowerCase()} agent key`
      }
      revealDisabled={!hasKey}
      copyDisabled={!hasKey}
      rotateDisabled={keyActionPending}
      className={className}
    />
  );
}
