import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentProfileModal } from "#/components/features/agents/new-agent-modal";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { renderWithProviders } from "../../../../test-utils";

const service = vi.hoisted(() => ({
  listProfiles: vi.fn(),
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}));
vi.mock("#/api/agent-profiles-service/agent-profiles-service.api", () => ({
  default: service,
}));
vi.mock("#/api/profiles-service/profiles-service.api", () => ({
  default: {
    listProfiles: vi.fn().mockResolvedValue({
      profiles: [{ name: "fast", model: "m1" }],
    }),
  },
}));

const saved = {
  id: "p1",
  agent_kind: "openhands",
  llm_profile_ref: "fast",
  system_message_suffix: "Be brief",
  tools: [{ name: "terminal" }],
};

beforeEach(() => {
  localStorage.clear();
  useFeedAgentConfigStore.setState({ configs: {} });
  useFeedIconsStore.setState({ icons: {} });
  service.listProfiles.mockResolvedValue({
    profiles: [{ id: "p1", name: "scout", agent_kind: "openhands" }],
    active_agent_profile_id: null,
  });
  service.getProfile.mockResolvedValue({ name: "scout", profile: saved });
  service.saveProfile.mockResolvedValue({ name: "scout", message: "ok" });
});

describe("AgentProfileModal", () => {
  it("creates a profile with its role, description, colour and icon", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    service.listProfiles.mockResolvedValue({
      profiles: [],
      active_agent_profile_id: null,
    });
    service.getProfile.mockResolvedValue({
      name: "nova",
      profile: { ...saved, id: "p9" },
    });
    renderWithProviders(<AgentProfileModal onClose={onClose} />);

    await user.type(screen.getByTestId("new-agent-name"), "nova");
    await screen.findByRole("option", { name: "fast · m1" });
    await user.selectOptions(screen.getByTestId("new-agent-llm"), "fast");
    await user.selectOptions(screen.getByTestId("new-agent-role"), "verifier");
    await user.type(
      screen.getByTestId("new-agent-description"),
      "Checks every PR",
    );
    await user.click(screen.getByTestId("new-agent-color-pink"));
    await user.click(screen.getByTestId("new-agent-create"));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(service.saveProfile).toHaveBeenCalledWith("nova", {
      agent_kind: "openhands",
      llm_profile_ref: "fast",
      system_message_suffix: null,
    });
    expect(useFeedAgentConfigStore.getState().configs.nova).toEqual({
      role: "verifier",
      description: "Checks every PR",
      color: "pink",
    });
  });

  it("edits an existing profile, keeping the fields the form does not show", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    useFeedAgentConfigStore
      .getState()
      .setConfig("scout", { role: "scout", description: "Old" });
    renderWithProviders(
      <AgentProfileModal editName="scout" onClose={onClose} />,
    );

    const instructions = screen.getByTestId("new-agent-instructions");
    await waitFor(() => expect(instructions).toHaveValue("Be brief"));
    expect(screen.getByTestId("new-agent-name")).toBeDisabled();
    expect(screen.getByTestId("new-agent-description")).toHaveValue("Old");

    await user.clear(instructions);
    await user.type(instructions, "Be thorough");
    await user.click(screen.getByTestId("new-agent-create"));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(service.saveProfile).toHaveBeenCalledWith(
      "scout",
      expect.objectContaining({
        system_message_suffix: "Be thorough",
        tools: [{ name: "terminal" }],
      }),
    );
    expect(service.saveProfile.mock.calls[0][1]).not.toHaveProperty("id");
    expect(useFeedAgentConfigStore.getState().configs.scout.role).toBe("scout");
  });
});
