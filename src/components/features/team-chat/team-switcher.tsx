import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogIn, Plus } from "lucide-react";
import type { TeamClient } from "#/chat-transport/nostr";
import { I18nKey } from "#/i18n/declaration";
import { Dropdown } from "#/ui/dropdown/dropdown";
import type { DropdownOption } from "#/ui/dropdown/types";
import {
  selectMyTeams,
  useTeamChatStore,
  type KnownTeam,
} from "#/stores/team-chat-store";
import { useTeamEntryStore } from "#/stores/team-chat-entry-store";
import {
  dropdownFooterActionClassName,
  dropdownMenuListClassName,
  dropdownMenuRowIconWrapperClassName,
} from "#/utils/dropdown-classes";
import { cn } from "#/utils/utils";

const SAMPLE_VALUE = "sample";

const sameTeam = (a: KnownTeam, b: KnownTeam) =>
  a.groupId === b.groupId && a.relayUrl === b.relayUrl;

const teamValue = (team: KnownTeam) => `team:${team.relayUrl}|${team.groupId}`;

/** A stable hue (0-359) for an id, so a team keeps its colour everywhere. */
const hueOf = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
};

/** The team's tile: its initials on a colour taken from a hash of its id. */
function TeamTile({ id, name }: { id: string; name: string }) {
  return (
    <span
      aria-hidden="true"
      data-testid="team-switcher-tile"
      style={{ "--tile-hue": hueOf(id) } as React.CSSProperties}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--tile-hue)_45%_38%)] text-xs font-medium text-white"
    >
      {name.trim().slice(0, 2).toUpperCase()}
    </span>
  );
}

const preventClose = (event: React.SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const FOOTER_ACTIONS = [
  { mode: "start", Icon: Plus, label: I18nKey.TEAM_CHAT$SWITCHER_CREATE },
  { mode: "join", Icon: LogIn, label: I18nKey.TEAM_CHAT$SWITCHER_JOIN },
] as const;

/**
 * The team at the top of the left bar, as the same dropdown the backend switcher uses:
 * every team this person has opened, the sample team, and ways to create or join another.
 * It also works over the sample (`sample`), where picking a real team leaves the sample.
 */
export function TeamSwitcher({
  client,
  sample = false,
  onStartTeam,
}: {
  client: TeamClient;
  sample?: boolean;
  /** Sample only: shows the create/join form over the sample. */
  onStartTeam?: (mode: "start" | "join") => void;
}) {
  const { t } = useTranslation("openhands");
  // The person's real teams always live in the saved store, even while the sample is shown.
  const teams = useTeamChatStore(selectMyTeams);
  const rememberTeam = useTeamChatStore((s) => s.rememberTeam);
  const switchTeam = useTeamChatStore((s) => s.switchTeam);
  const closeTeam = useTeamChatStore((s) => s.closeTeam);
  const setIntent = useTeamEntryStore((s) => s.setIntent);
  // Bumped to close the menu after a footer action that keeps this screen.
  const [menuKey, setMenuKey] = useState(0);
  const sampleLabel = t(I18nKey.TEAM_CHAT$SAMPLE_TEAM);
  const current: KnownTeam = {
    relayUrl: client.relayUrl,
    groupId: client.groupId,
    name: client.name,
  };

  useEffect(() => {
    if (sample) return;
    rememberTeam({
      relayUrl: client.relayUrl,
      groupId: client.groupId,
      name: client.name,
    });
  }, [sample, rememberTeam, client.relayUrl, client.groupId, client.name]);

  // The open team is always listed, even before it has been remembered.
  const listed =
    sample || teams.some((team) => sameTeam(team, current))
      ? teams
      : [...teams, current];
  const options: DropdownOption[] = [
    ...listed.map((team) => ({
      value: teamValue(team),
      label: team.name,
      prefix: <TeamTile id={team.groupId} name={team.name} />,
    })),
    {
      value: SAMPLE_VALUE,
      label: sampleLabel,
      prefix: <TeamTile id={SAMPLE_VALUE} name={sampleLabel} />,
    },
  ];
  const activeValue = sample ? SAMPLE_VALUE : teamValue(current);
  const active = options.find((o) => o.value === activeValue) ?? options[0];

  const onPick = (item: DropdownOption | null) => {
    if (!item || item.value === activeValue) return;
    if (item.value === SAMPLE_VALUE) {
      setIntent("sample");
      closeTeam();
      return;
    }
    const team = listed.find((tm) => teamValue(tm) === item.value);
    if (team) switchTeam(team);
  };

  const start = (mode: "start" | "join") => {
    if (sample) {
      onStartTeam?.(mode);
      setMenuKey((k) => k + 1);
      return;
    }
    setIntent(mode);
    closeTeam();
  };

  const footer = (
    <div className={dropdownMenuListClassName}>
      {FOOTER_ACTIONS.map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          data-testid={`team-switcher-${mode}`}
          onMouseDown={preventClose}
          onTouchStart={preventClose}
          onClick={(event) => {
            preventClose(event);
            start(mode);
          }}
          className={cn(dropdownFooterActionClassName, "cursor-pointer")}
        >
          <span className={dropdownMenuRowIconWrapperClassName} aria-hidden>
            <Icon width={16} height={16} />
          </span>
          {t(label)}
        </button>
      ))}
    </div>
  );

  return (
    <Dropdown
      key={`${menuKey}-${active.value}-${active.label}`}
      testId="team-switcher"
      italicPlaceholder={false}
      defaultValue={active}
      placeholder={active.label}
      options={options}
      footer={footer}
      onChange={onPick}
      className="-ml-2.5 w-[calc(100%+0.625rem)] h-10 [&_input]:text-[15px] [&_input]:font-normal [&_input::placeholder]:text-contrast text-contrast [&_[data-testid=dropdown-trigger]]:text-muted pl-1.5 pr-2 py-0 bg-base-secondary border-transparent hover:bg-surface-raised focus-within:bg-surface-raised focus-within:border-transparent focus-within:ring-0"
    />
  );
}
