import * as vitestDemoOn from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelinePage } from "#/components/features/automations/factory/pipeline-page";
import {
  humanGates,
  stageKey,
} from "#/components/features/automations/factory/human-roles";
import { PIPELINE_TEMPLATES } from "#/components/features/automations/factory/pipeline-templates";
import type { FactoryData } from "#/components/features/automations/factory/use-factory-data";
import {
  MAX_HUMAN_ROLES,
  MIN_HUMAN_ROLES,
} from "#/constants/factory-human-roles";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { FEED_FACTORIES, FEED_TEAMMATES } from "#/utils/feed-team-demo";
import { renderWithProviders } from "../../../test-utils";

// Render the real English copy so the tests read what a person reads.
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  const copy = (await import("#/i18n/translation.json")).default as Record<
    string,
    { en: string }
  >;
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, values: Record<string, string | number> = {}) =>
        (copy[key]?.en ?? key).replace(/{{(\w+)}}/g, (_, name) =>
          String(values[name]),
        ),
      i18n: { language: "en" },
    }),
  };
});

// The node map needs real layout, which jsdom does not have.
vi.mock("#/components/features/automations/factory/pipeline-map", () => ({
  PipelineMap: () => <div data-testid="map-stub" />,
}));

const factory = FEED_FACTORIES[0];
const DATA: FactoryData = {
  conversations: [],
  live: 0,
  agents: [],
  projects: [],
  lastActivity: null,
  isLoading: false,
};
const RELEASE = PIPELINE_TEMPLATES.find((tpl) => tpl.id === "release-train")!;
const SDLC = PIPELINE_TEMPLATES[0];
const HITL1 = stageKey(SDLC.id, "hitl1");

const renderPipeline = () =>
  renderWithProviders(<PipelinePage factory={factory} data={DATA} />);

const useReleaseTrain = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByTestId("pipeline-template-release-train"));

beforeEach(() => {
  localStorage.clear();
  useFeedFactoriesStore.setState({
    custom: [],
    humanRoleCounts: {},
    humanAssignments: {},
  });
});

describe("human-in-the-loop stage definitions", () => {
  it("flags only gates a person passes, not trigger steps", () => {
    expect(humanGates(SDLC).map((s) => s.id)).toEqual([
      "hitl1",
      "hitl2",
      "eng",
    ]);
    expect(humanGates(RELEASE).map((s) => s.id)).toEqual(["signoff"]);
  });
});

describe("human roles in the pipeline", () => {
  it("starts with each gate's default number of empty slots", async () => {
    const user = userEvent.setup();
    renderPipeline();

    const first = screen.getByTestId("human-roles-stage-hitl1");
    expect(within(first).getAllByTestId("human-role-slot-empty")).toHaveLength(
      1,
    );
    expect(screen.getByTestId("human-roles-open")).toHaveAttribute(
      "data-tone",
      "warning",
    );

    await useReleaseTrain(user);
    const signoff = screen.getByTestId("human-roles-stage-signoff");
    expect(
      within(signoff).getAllByTestId("human-role-slot-empty"),
    ).toHaveLength(2);
    expect(screen.getByTestId("human-roles-count-signoff")).toHaveTextContent(
      "2",
    );
  });

  it("limits the stepper to 1..5 and persists the change", async () => {
    const user = userEvent.setup();
    renderPipeline();
    const up = screen.getByTestId("human-roles-increase-hitl1");
    const down = screen.getByTestId("human-roles-decrease-hitl1");

    expect(down).toBeDisabled();
    for (let i = 0; i < MAX_HUMAN_ROLES; i += 1) {
      if (!up.hasAttribute("disabled")) await user.click(up);
    }
    expect(up).toBeDisabled();
    expect(screen.getByTestId("human-roles-count-hitl1")).toHaveTextContent(
      String(MAX_HUMAN_ROLES),
    );
    expect(
      useFeedFactoriesStore.getState().humanRoleCounts[factory.id][HITL1],
    ).toBe(MAX_HUMAN_ROLES);
  });

  it("will not lower the count below the people already filling it", async () => {
    const user = userEvent.setup();
    const state = useFeedFactoriesStore.getState();
    state.setHumanRoleCount(factory.id, HITL1, 3);
    state.assignPerson(factory.id, HITL1, { id: "maya", name: "Maya Chen" });
    state.assignPerson(factory.id, HITL1, { id: "dev", name: "Dev Patel" });
    renderPipeline();

    const down = screen.getByTestId("human-roles-decrease-hitl1");
    await user.click(down);
    expect(down).toBeDisabled();
    expect(down).toHaveAttribute("title");
    expect(screen.getByTestId("human-roles-count-hitl1")).toHaveTextContent(
      "2",
    );
    expect(
      useFeedFactoriesStore.getState().humanRoleCounts[factory.id][HITL1],
    ).toBeGreaterThanOrEqual(2);
    expect(MIN_HUMAN_ROLES).toBe(1);
  });

  it("shows filled and pending slots and removes them", async () => {
    const user = userEvent.setup();
    const state = useFeedFactoriesStore.getState();
    state.assignPerson(factory.id, HITL1, { id: "maya", name: "Maya Chen" });
    state.setHumanRoleCount(factory.id, HITL1, 2);
    state.inviteByEmail(factory.id, HITL1, { email: "Sam@Example.com" });
    renderPipeline();

    const stage = screen.getByTestId("human-roles-stage-hitl1");
    expect(within(stage).getByText(/Maya Chen/)).toBeInTheDocument();
    const pending = within(stage).getByTestId("human-role-slot-pending");
    expect(pending).toHaveTextContent("sam@example.com");
    expect(within(pending).getByText("Pending")).toBeInTheDocument();
    expect(
      within(stage).getByTestId("human-roles-summary-hitl1"),
    ).toHaveAttribute("data-tone", "ok");

    await user.click(
      within(stage).getByRole("button", { name: /Remove Maya Chen/ }),
    );
    expect(within(stage).queryByText(/Maya Chen/)).toBeNull();
    expect(
      within(stage).getByTestId("human-roles-summary-hitl1"),
    ).toHaveAttribute("data-tone", "warning");
  });
});

describe("invite modal", () => {
  const openModal = async (user: ReturnType<typeof userEvent.setup>) => {
    const trigger = within(
      screen.getByTestId("human-roles-stage-hitl1"),
    ).getByTestId("human-role-slot-empty");
    await user.click(trigger);
    return { trigger, dialog: await screen.findByRole("dialog") };
  };

  it("assigns a teammate picked from the list and hides assigned people", async () => {
    const user = userEvent.setup();
    useFeedFactoriesStore
      .getState()
      .assignPerson(factory.id, HITL1, { id: "dev", name: "Dev Patel" });
    useFeedFactoriesStore.getState().setHumanRoleCount(factory.id, HITL1, 2);
    renderPipeline();
    await openModal(user);

    expect(screen.queryByTestId("invite-person-dev")).toBeNull();
    expect(screen.getByTestId("invite-submit")).toBeDisabled();
    await user.type(screen.getByTestId("invite-search"), "lena");
    expect(screen.queryByTestId("invite-person-maya")).toBeNull();
    await user.click(screen.getByTestId("invite-person-lena"));
    await user.click(screen.getByTestId("invite-submit"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      useFeedFactoriesStore
        .getState()
        .humanAssignments[factory.id][HITL1].map((a) => a.personId),
    ).toEqual(["dev", "lena"]);
    expect(FEED_TEAMMATES.some((p) => p.id === "lena")).toBe(true);
  });

  it("validates email, rejects duplicates and saves a pending invite without any network call", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    useFeedFactoriesStore
      .getState()
      .inviteByEmail(factory.id, HITL1, { email: "taken@example.com" });
    useFeedFactoriesStore.getState().setHumanRoleCount(factory.id, HITL1, 2);
    renderPipeline();
    await openModal(user);
    await user.click(screen.getByTestId("invite-tab-email"));

    const email = screen.getByTestId("invite-email");
    await user.type(email, "not-an-email");
    await user.tab();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("invite-submit")).toBeDisabled();

    await user.clear(email);
    await user.type(email, "  TAKEN@example.com ");
    await user.tab();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("invite-submit")).toBeDisabled();

    await user.clear(email);
    await user.type(email, "  New.Person@Example.com ");
    await user.type(screen.getByTestId("invite-name"), "New Person");
    await user.click(screen.getByTestId("invite-submit"));

    expect(
      within(screen.getByRole("dialog")).getByRole("status"),
    ).toHaveTextContent(/Nobody has been emailed/);
    const saved =
      useFeedFactoriesStore.getState().humanAssignments[factory.id][HITL1];
    expect(saved[1]).toMatchObject({
      status: "pending",
      email: "new.person@example.com",
      name: "New Person",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("offers a copyable message and a mailto link that name the factory, role and stage", async () => {
    const user = userEvent.setup();
    renderPipeline();
    await openModal(user);
    await user.click(screen.getByTestId("invite-tab-email"));
    await user.type(screen.getByTestId("invite-email"), "sam@example.com");
    await user.click(screen.getByTestId("invite-submit"));

    await user.click(screen.getByTestId("invite-copy-message"));
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain(factory.name);
    expect(copied).toContain("HITL review first");
    expect(copied).toContain(`/automations/factories/${factory.id}/pipeline`);

    const href = screen.getByTestId("invite-open-mail").getAttribute("href")!;
    expect(href.startsWith("mailto:sam%40example.com?subject=")).toBe(true);
    const url = new URL(href);
    expect(decodeURIComponent(url.searchParams.get("body") ?? "")).toBe(copied);
    expect(url.searchParams.get("subject")).toContain(factory.name);
  });

  it("is a labelled dialog that closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPipeline();
    const { trigger, dialog } = await openModal(user);

    expect(dialog).toHaveAccessibleName(/Reviewer/);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

describe("persistence", () => {
  it("keeps assignments across a remount", async () => {
    const user = userEvent.setup();
    const first = renderPipeline();
    await user.click(
      within(screen.getByTestId("human-roles-stage-hitl1")).getByTestId(
        "human-role-slot-empty",
      ),
    );
    await user.click(await screen.findByTestId("invite-person-maya"));
    await user.click(screen.getByTestId("invite-submit"));
    first.unmount();

    renderPipeline();
    expect(
      within(screen.getByTestId("human-roles-stage-hitl1")).getByText(
        /Maya Chen/,
      ),
    ).toBeInTheDocument();
  });
});

describe("store", () => {
  it("hydrates state saved before human roles existed", async () => {
    localStorage.setItem(
      "feed-factories",
      JSON.stringify({
        state: { custom: [], templates: { web: "release-train" } },
        version: 0,
      }),
    );
    await useFeedFactoriesStore.persist.rehydrate();

    const state = useFeedFactoriesStore.getState();
    expect(state.templates.web).toBe("release-train");
    expect(state.humanRoleCounts).toEqual({});
    expect(state.humanAssignments).toEqual({});
  });

  it("deletes a factory with its roles and leaves other factories alone", () => {
    const state = useFeedFactoriesStore.getState();
    state.assignPerson("a", HITL1, { id: "maya", name: "Maya Chen" });
    state.setHumanRoleCount("a", HITL1, 3);
    state.assignPerson("b", HITL1, { id: "dev", name: "Dev Patel" });

    state.deleteFactory("a");

    const after = useFeedFactoriesStore.getState();
    expect(after.humanAssignments.a).toBeUndefined();
    expect(after.humanRoleCounts.a).toBeUndefined();
    expect(after.humanAssignments.b[HITL1]).toHaveLength(1);
  });

  it("ignores a second assignment of the same person to a stage", () => {
    const state = useFeedFactoriesStore.getState();
    state.assignPerson("a", HITL1, { id: "maya", name: "Maya Chen" });
    state.assignPerson("a", HITL1, { id: "maya", name: "Maya Chen" });
    expect(
      useFeedFactoriesStore.getState().humanAssignments.a[HITL1],
    ).toHaveLength(1);
  });
});

// These cover the simulated team, which is opt-in.
vitestDemoOn.beforeEach(() => window.history.pushState({}, "", "/?demoTeam=on"));
vitestDemoOn.afterEach(() => window.history.pushState({}, "", "/"));
