import { ListChecks, RotateCcw, Save, UploadCloud } from "lucide-react";

import { PermissionProfileAgentKeyCard } from "@/src/components/dashboard/permission-profile-agent-key-card";
import {
  CompactPanel,
  dashboardInputClassName,
} from "@/src/components/dashboard/shared";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { PermissionProfile } from "@/src/types/integrations-hub";

const profileCounts = (profile: PermissionProfile) => {
  const integrations = Object.values(profile.snapshot.integrations);
  return integrations.reduce(
    (counts, integration) => {
      counts.integrations += 1;
      if (integration.enabled) {
        counts.enabledIntegrations += 1;
      }
      for (const mode of Object.values(integration.tools)) {
        counts.tools += 1;
        if (!integration.enabled) {
          counts.disabled += 1;
          continue;
        }
        counts[mode] += 1;
      }
      return counts;
    },
    {
      integrations: 0,
      enabledIntegrations: 0,
      tools: 0,
      enabled: 0,
      approval_required: 0,
      disabled: 0,
    },
  );
};

const profileLabel = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

const isDefaultProfile = (profile: PermissionProfile) => profile.name === null;

interface PermissionProfilesSectionProps {
  profileName: string;
  profiles: PermissionProfile[];
  isPending: boolean;
  errorMessage?: string | null;
  actionPending: boolean;
  onCreateProfile: () => void;
  onLoadProfile: (profile: PermissionProfile) => void;
  onUpdateProfile: (profile: PermissionProfile) => void;
  setProfileName: (value: string) => void;
}

export const PermissionProfilesSection = ({
  profileName,
  profiles,
  isPending,
  errorMessage,
  actionPending,
  onCreateProfile,
  onLoadProfile,
  onUpdateProfile,
  setProfileName,
}: PermissionProfilesSectionProps) => (
  <section className="space-y-4">
    <CompactPanel title="Save current permissions" icon={Save}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[var(--color-text-base)]">
          Capture the currently active integration enablement and per-tool access modes
          as a reusable profile. Profiles store only permission settings, never provider
          credentials.
        </p>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
            Profile name
          </span>
          <input
            className={`${dashboardInputClassName} w-full`}
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="e.g. Research assistant"
            maxLength={80}
          />
        </label>
        <Button
          type="button"
          className="w-full"
          disabled={actionPending || profileName.trim().length === 0}
          onClick={onCreateProfile}
        >
          Save current settings
        </Button>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
          Loading a profile applies saved modes to matching installed integrations and
          tools. New tools that were not present when the profile was saved are left
          unchanged.
        </div>
      </div>
    </CompactPanel>

    <CompactPanel
      title="Saved permission profiles"
      icon={ListChecks}
      action={<Badge>{profiles.length} saved</Badge>}
    >
      {errorMessage ? (
        <div className="rounded-xl border border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? (
        <p className="text-sm text-[var(--color-text-base)]">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm leading-6 text-[var(--color-text-base)]">
          No profiles yet. Save the current integration permissions to create your
          first reusable profile.
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const counts = profileCounts(profile);
            return (
              <article
                key={profile.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {profileLabel(profile)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-base)]">
                      Updated {new Date(profile.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{counts.enabledIntegrations}/{counts.integrations} integrations on</Badge>
                    <Badge tone="success">{counts.enabled} enabled</Badge>
                    <Badge tone="warning">{counts.approval_required} case-by-case</Badge>
                    <Badge tone="danger">{counts.disabled} disabled</Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <PermissionProfileAgentKeyCard
                    profile={profile}
                    variant="inline"
                  />
                </div>
                {isDefaultProfile(profile) ? null : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={actionPending}
                      onClick={() => onLoadProfile(profile)}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Load profile
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={actionPending}
                      onClick={() => onUpdateProfile(profile)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Update from current
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </CompactPanel>
  </section>
);
