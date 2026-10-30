import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FactoryAddAgentModal } from "#/components/features/automations/factory/factory-agent-modals";
import type { Roster } from "#/components/features/automations/factory/factory-routing-context";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { renderWithProviders } from "../../../../../test-utils";

const agentService = vi.hoisted(() => ({
  listProfiles: vi.fn(),
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}));
const llmService = vi.hoisted(() => ({ listProfiles: vi.fn() }));
vi.mock("#/api/agent-profiles-service/agent-profiles-service.api", () => ({
  default: agentService,
}));
vi.mock("#/api/profiles-service/profiles-service.api", () => ({
  default: llmService,
}));

const agent = (name: string) => ({
  agent: { name, role: "worker", tier: null, Icon: () => null, className: "" },
  conversations: 0,
  live: 0,
});
// Every existing agent is already a member: nothing is left to pick.
const roster = { coordinator: agent("Lead"), others: [] } as unknown as Roster;

const LLMS = [
  { name: "cheap", model: "claude-haiku-5-5" },
  { name: "mid", model: "claude-sonnet-5-5" },
  { name: "big", model: "claude-opus-5-5" },
];

function renderModal(onClose = vi.fn()) {
  renderWithProviders(
    <FactoryAddAgentModal factoryId="f1" roster={roster} onClose={onClose} />,
  );
  return onClose;
}

const members = () => useFeedFactoriesStore.getState().addedAgents.f1 ?? [];

beforeEach(() => {
  localStorage.clear();
  useFeedAgentConfigStore.setState({ configs: {} });
  useFeedIconsStore.setState({ icons: {} });
  useFeedFactoriesStore.setState({ addedAgents: {}, coordinators: {} });
  agentService.listProfiles.mockResolvedValue({
    profiles: [],
    active_agent_profile_id: null,
  });
  agentService.saveProfile.mockResolvedValue({ name: "x", message: "ok" });
  agentService.getProfile.mockResolvedValue({ profile: { id: "p1" } });
  llmService.listProfiles.mockResolvedValue({ profiles: LLMS });
});

describe("Factory add agent templates", () => {
  it("lists the templates even when every agent is already a member", async () => {
    renderModal();

    expect(await screen.findAllByTestId("factory-template")).not.toHaveLength(
      0,
    );
    expect(screen.queryByTestId("factory-add-agent-option")).toBeNull();
  });

  it("creates the profile on the tier-matched LLM profile and joins the factory with its role", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();
    const template = (await screen.findAllByTestId("factory-template")).find(
      (el) => el.getAttribute("data-template") === "worker-t2",
    )!;
    await user.click(within(template).getByTestId("factory-template-use"));

    await screen.findByRole("option", { name: "mid · claude-sonnet-5-5" });
    expect(screen.getByTestId("new-agent-llm")).toHaveValue("mid");
    expect(screen.getByTestId("new-agent-name")).toHaveValue("Worker-T2");
    await user.click(screen.getByTestId("new-agent-create"));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(agentService.saveProfile).toHaveBeenCalledWith(
      "Worker-T2",
      expect.objectContaining({
        agent_kind: "openhands",
        llm_profile_ref: "mid",
        system_message_suffix: expect.stringContaining("T2 worker"),
      }),
    );
    expect(members()).toEqual(["Worker-T2"]);
    expect(
      useFeedAgentConfigStore.getState().configs["Worker-T2"],
    ).toMatchObject({ role: "worker", tier: 2 });
  });

  it("makes a conductor template the factory coordinator when asked", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findAllByTestId("factory-template");
    await user.click(screen.getByTestId("factory-template-conductor"));
    const conductor = screen.getByText("Conductor").closest("li")!;
    await user.click(within(conductor).getByTestId("factory-template-use"));
    await screen.findByRole("option", { name: "big · claude-opus-5-5" });
    // No Fable-class profile exists, so nothing is preselected: choose one.
    expect(screen.getByTestId("new-agent-llm")).toHaveValue("");
    await user.selectOptions(screen.getByTestId("new-agent-llm"), "big");
    await user.click(screen.getByTestId("new-agent-create"));

    await waitFor(() =>
      expect(useFeedFactoriesStore.getState().coordinators.f1).toBe(
        "Conductor",
      ),
    );
  });

  it("offers to add an existing profile instead of duplicating its name", async () => {
    const user = userEvent.setup();
    agentService.listProfiles.mockResolvedValue({
      profiles: [{ id: "p9", name: "Scout", agent_kind: "openhands" }],
      active_agent_profile_id: null,
    });
    const onClose = renderModal();
    const scout = (await screen.findAllByTestId("factory-template")).find(
      (el) => el.getAttribute("data-template") === "scout",
    )!;
    await user.click(
      await within(scout).findByTestId("factory-template-add-existing"),
    );

    expect(agentService.saveProfile).not.toHaveBeenCalled();
    expect(members()).toEqual(["Scout"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("creates the suggested team after confirmation, with estimated spend", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByTestId("factory-suggested-team"));

    expect(
      await screen.findAllByTestId("factory-suggested-team-member"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("factory-suggested-team-spend"),
    ).toBeInTheDocument();
    expect(agentService.saveProfile).not.toHaveBeenCalled();
    // The Fable-class conductor has no matching profile: pick one explicitly.
    const create = screen.getByTestId("factory-suggested-team-create");
    expect(create).toBeDisabled();
    const picks = screen.getAllByTestId("factory-suggested-team-llm");
    await user.selectOptions(picks[0], "big");
    await user.click(create);

    await waitFor(() => expect(members()).toHaveLength(3));
    expect(agentService.saveProfile).toHaveBeenCalledTimes(3);
    expect(agentService.saveProfile).toHaveBeenCalledWith(
      "Verifier",
      expect.objectContaining({ llm_profile_ref: "mid" }),
    );
    expect(members()).toEqual(
      expect.arrayContaining(["Conductor", "Worker-T2", "Verifier"]),
    );
  });

  it("never invents a model: with no LLM profiles templates are disabled with a reason", async () => {
    llmService.listProfiles.mockResolvedValue({ profiles: [] });
    renderModal();

    expect(await screen.findByRole("status")).toBeInTheDocument();
    for (const button of screen.getAllByTestId("factory-template-use")) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByTestId("factory-suggested-team")).toBeDisabled();
  });
});
