import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TeamSwitcher } from "#/components/features/team-chat/team-switcher";
import { useTeamChatStore } from "#/stores/team-chat-store";
import { useTeamEntryStore } from "#/stores/team-chat-entry-store";
import type { TeamClient } from "#/chat-transport/nostr";

const ME = { pubkey: "pk-me", name: "Maya", nsec: "nsec-me", secretKey: "sk" };
const RELAY = "ws://relay.test";

const clientFor = (groupId: string, name: string) =>
  ({ relayUrl: RELAY, groupId, name }) as unknown as TeamClient;

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    within(screen.getByTestId("team-switcher")).getByRole("button"),
  );
  return screen.getAllByRole("option");
};

describe("TeamSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    useTeamEntryStore.setState({ intent: null });
    useTeamChatStore.setState({
      account: ME as never,
      relayUrl: RELAY,
      groupId: "g1",
      knownTeams: {
        [ME.pubkey]: [
          { relayUrl: RELAY, groupId: "g1", name: "Kosmonauts" },
          { relayUrl: RELAY, groupId: "g2", name: "Design guild" },
        ],
      },
      teamsByPubkey: {},
    });
  });

  it("lists the teams and the sample, marks the open one, and switches to another", async () => {
    const user = userEvent.setup();
    render(<TeamSwitcher client={clientFor("g1", "Kosmonauts")} />);

    const items = await openMenu(user);
    expect(items).toHaveLength(3);
    ["Kosmonauts", "Design guild", "TEAM_CHAT$SAMPLE_TEAM"].forEach(
      (label, i) => expect(items[i].textContent?.endsWith(label)).toBe(true),
    );
    expect(items[0]).toHaveAttribute("aria-selected", "true");

    await user.click(items[1]);

    expect(useTeamChatStore.getState().groupId).toBe("g2");
  });

  it("remembers the open team so it is in the list next time", () => {
    useTeamChatStore.setState({ knownTeams: {} });

    render(<TeamSwitcher client={clientFor("g9", "New crew")} />);

    expect(useTeamChatStore.getState().knownTeams[ME.pubkey]).toEqual([
      { relayUrl: RELAY, groupId: "g9", name: "New crew" },
    ]);
  });

  it.each([
    ["team-switcher-start", "start"],
    ["team-switcher-join", "join"],
  ])(
    "%s leaves the team, keeping the account, for the %s form",
    async (id, intent) => {
      const user = userEvent.setup();
      render(<TeamSwitcher client={clientFor("g1", "Kosmonauts")} />);

      await openMenu(user);
      await user.click(screen.getByTestId(id));

      expect(useTeamChatStore.getState().groupId).toBeNull();
      expect(useTeamChatStore.getState().account).not.toBeNull();
      expect(useTeamEntryStore.getState().intent).toBe(intent);
    },
  );

  it("enters the sample from a real team", async () => {
    const user = userEvent.setup();
    render(<TeamSwitcher client={clientFor("g1", "Kosmonauts")} />);

    const items = await openMenu(user);
    await user.click(items[2]);

    expect(useTeamChatStore.getState().groupId).toBeNull();
    expect(useTeamEntryStore.getState().intent).toBe("sample");
  });

  describe("over the sample team", () => {
    it("shows the sample as selected beside the real teams, and picking one leaves the sample", async () => {
      const user = userEvent.setup();
      render(<TeamSwitcher client={clientFor("demo", "Kosmonauts")} sample />);

      const items = await openMenu(user);
      expect(items).toHaveLength(3);
      ["Kosmonauts", "Design guild", "TEAM_CHAT$SAMPLE_TEAM"].forEach(
        (label, i) => expect(items[i].textContent?.endsWith(label)).toBe(true),
      );
      expect(items[2]).toHaveAttribute("aria-selected", "true");
      await user.click(items[1]);

      expect(useTeamChatStore.getState().groupId).toBe("g2");
    });

    it("does not record the sample as one of your teams", () => {
      useTeamChatStore.setState({ knownTeams: {} });

      render(<TeamSwitcher client={clientFor("demo", "Kosmonauts")} sample />);

      expect(useTeamChatStore.getState().knownTeams).toEqual({});
    });

    it("asks the sample screen for the create or join form without leaving it", async () => {
      const user = userEvent.setup();
      const modes: string[] = [];
      render(
        <TeamSwitcher
          client={clientFor("demo", "Kosmonauts")}
          sample
          onStartTeam={(m) => modes.push(m)}
        />,
      );

      await openMenu(user);
      await user.click(screen.getByTestId("team-switcher-join"));

      expect(modes).toEqual(["join"]);
      expect(useTeamChatStore.getState().groupId).toBe("g1");
      expect(
        screen.queryByTestId("team-switcher-join"),
      ).not.toBeInTheDocument();
    });
  });
});
