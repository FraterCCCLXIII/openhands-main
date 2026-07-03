import { useEffect, useState } from "react";

import { DashboardApiKeyCard } from "@/src/components/dashboard/api-key-card";
import {
  copyTextToClipboard,
  maskApiKey,
} from "@/src/components/dashboard/utils";
import { fetchJson } from "@/src/lib/fetch-json";
import type { PermissionProfile } from "@/src/types/integrations-hub";

const profileName = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

interface PermissionProfileAgentKeyCardProps {
  description?: string;
  profile: PermissionProfile;
  variant?: "card" | "inline";
}

export const PermissionProfileAgentKeyCard = ({
  description = "Give this key to agents that should use this permission profile.",
  profile,
  variant = "card",
}: PermissionProfileAgentKeyCardProps) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentApiKey, setAgentApiKey] = useState(
    profile.agentApiKey?.trim() ?? "",
  );
  const [keyActionPending, setKeyActionPending] = useState(false);
  const [keyActionError, setKeyActionError] = useState<string | null>(null);
  const hasKey = agentApiKey.length > 0;

  useEffect(() => {
    setAgentApiKey(profile.agentApiKey?.trim() ?? "");
    setRevealed(false);
    setCopied(false);
    setKeyActionError(null);
  }, [profile.agentApiKey, profile.id]);

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

  const handleCopy = async () => {
    if (!hasKey) {
      return;
    }

    await copyTextToClipboard(agentApiKey);
    setCopied(true);
  };

  const handleRotate = async () => {
    if (keyActionPending) {
      return;
    }

    setKeyActionPending(true);
    setKeyActionError(null);

    try {
      const updatedProfile = await fetchJson<PermissionProfile>(
        `/api/permission-profiles/${profile.id}/agent-key`,
        { method: "POST" },
      );
      const nextKey = updatedProfile.agentApiKey?.trim() ?? "";
      setAgentApiKey(nextKey);
      setRevealed(nextKey.length > 0);
      setCopied(false);
    } catch {
      setKeyActionError(
        hasKey
          ? "Unable to rotate the agent key right now."
          : "Unable to provision the agent key right now.",
      );
    } finally {
      setKeyActionPending(false);
    }
  };

  return (
    <DashboardApiKeyCard
      badgeLabel={profile.name ? "Named" : "Default"}
      badgeTone={profile.name ? "default" : "success"}
      copied={copied}
      description={description}
      label={`${profileName(profile)} agent key`}
      maskedValue={
        hasKey
          ? maskApiKey(agentApiKey, revealed)
          : keyActionError ??
            "No agent key has been provisioned for this profile yet."
      }
      onCopy={handleCopy}
      onRotate={handleRotate}
      onRevealToggle={() => setRevealed((current) => !current)}
      revealDisabled={!hasKey}
      revealed={revealed}
      rotateDisabled={keyActionPending}
      rotateLabel={
        keyActionPending
          ? hasKey
            ? "Rotating"
            : "Provisioning"
          : hasKey
            ? "Rotate"
            : "Provision"
      }
      variant={variant}
    />
  );
};
