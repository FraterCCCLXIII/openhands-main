import * as vitestDemoOn from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FactoryPage } from "#/components/features/automations/factory/factory-page";
import SkillsService from "#/api/skills-service";
import { SecretsService } from "#/api/secrets-service";
import AutomationService from "#/api/automation-service/automation-service.api";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { buildFactorySecretName } from "#/utils/factory-secrets";
import type { Automation } from "#/types/automation";
import { MemoryRouter, Route, Routes } from "react-router";
import { renderWithProviders } from "../../../test-utils";

vi.mock("#/api/skills-service");
vi.mock("#/api/secrets-service");
vi.mock("#/api/automation-service/automation-service.api");
vi.mock("#/hooks/use-feed-conversations", () => ({
  useFeedConversations: () => ({ conversations: [], isLoading: false }),
}));

const SECRET_VALUE = "sk-live-never-render-me-123456";
const FACTORY_ID = "web";

const skill = (name: string) => ({
  name,
  type: "repo",
  source: "public",
  origin: "public",
  description: `${name} description`,
});

const automation = (id: string, name: string): Automation =>
  ({
    id,
    name,
    enabled: true,
    trigger: { type: "cron", schedule: "0 9 * * *" },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    prompt: null,
  }) as Automation;

const renderSection = (section?: string) => {
  const path = `/automations/factories/${FACTORY_ID}${section ? `/${section}` : ""}`;
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/automations/factories/:factoryId/:section?"
          element={<FactoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useFeedFactoriesStore.setState({
    disabledSkills: {},
    automationIds: {},
  });
  vi.mocked(SkillsService.getSkillCatalog).mockResolvedValue([
    skill("github"),
    skill("docker"),
  ] as never);
  vi.mocked(SecretsService.getSecrets).mockResolvedValue([]);
  vi.mocked(AutomationService.checkHealth).mockResolvedValue({
    status: "ok",
  } as never);
  vi.mocked(AutomationService.getAutomations).mockResolvedValue({
    automations: [],
    total: 0,
  });
});

describe("factory page navigation", () => {
  it("lists Skills, Automations and Keys & secrets in the section nav", () => {
    renderSection();

    ["skills", "automations", "vault"].forEach((id) =>
      screen
        .getAllByTestId(`factory-navigation-${id}`)
        .forEach((link) =>
          expect(link).toHaveAttribute(
            "href",
            expect.stringContaining(
              `/automations/factories/${FACTORY_ID}/${id}`,
            ),
          ),
        ),
    );
  });

  it("falls back to the overview for an unknown section", () => {
    renderSection("nonsense");

    expect(screen.queryByTestId("factory-section-vault")).toBeNull();
    expect(screen.queryByTestId("factory-section-skills")).toBeNull();
  });
});

describe("factory skills section", () => {
  it("persists a per-factory switch-off across a remount", async () => {
    const user = userEvent.setup();
    const first = renderSection("skills");
    const toggleName = "FACTORY$SKILL_TOGGLE";
    const switches = await screen.findAllByRole("switch", {
      name: toggleName,
    });
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute("aria-checked", "true");

    await user.click(switches[0]);
    first.unmount();
    renderSection("skills");

    const remounted = await screen.findAllByRole("switch", {
      name: toggleName,
    });
    expect(remounted[0]).toHaveAttribute("aria-checked", "false");
    expect(remounted[1]).toHaveAttribute("aria-checked", "true");
  });
});

describe("factory automations section", () => {
  it("shows the empty state, then attaches and detaches an automation", async () => {
    vi.mocked(AutomationService.getAutomations).mockResolvedValue({
      automations: [automation("a1", "Nightly triage")],
      total: 1,
    });
    const user = userEvent.setup();
    renderSection("automations");

    expect(
      await screen.findByTestId("factory-automations-empty"),
    ).toBeInTheDocument();
    await screen.findByRole("option", { name: "Nightly triage" });
    await user.selectOptions(
      screen.getByTestId("factory-automation-attach"),
      "a1",
    );
    const row = await screen.findByTestId("factory-automation");
    expect(within(row).getByText("Nightly triage")).toBeInTheDocument();

    await user.click(within(row).getByTestId("factory-automation-toggle"));
    expect(AutomationService.toggleAutomation).toHaveBeenCalledWith(
      "a1",
      false,
    );

    await user.click(within(row).getByTestId("factory-automation-detach"));
    expect(
      await screen.findByTestId("factory-automations-empty"),
    ).toBeInTheDocument();
  });
});

describe("factory vault section", () => {
  it("shows the empty state and keeps unscoped secrets in a read-only group", async () => {
    vi.mocked(SecretsService.getSecrets).mockResolvedValue([
      { name: "OPENAI_API_KEY" },
      { name: buildFactorySecretName("data", "OTHER")! },
    ]);
    renderSection("vault");

    expect(
      await screen.findByTestId("factory-vault-empty"),
    ).toBeInTheDocument();
    const shared = await screen.findByTestId("factory-vault-shared");
    expect(within(shared).getByText("OPENAI_API_KEY")).toBeInTheDocument();
    expect(within(shared).queryByText(/OTHER/)).toBeNull();
  });

  it("saves under the prefixed name and never renders or logs the value", async () => {
    const user = userEvent.setup();
    const logSpies = (["log", "info", "warn", "error"] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    );
    vi.mocked(SecretsService.createSecret).mockResolvedValue(undefined);
    renderSection("vault");

    await user.click(await screen.findByTestId("factory-vault-add"));
    await user.type(screen.getByTestId("factory-vault-name"), "GITHUB_TOKEN");
    const valueInput = screen.getByTestId("factory-vault-value");
    expect(valueInput).toHaveAttribute("type", "password");
    await user.type(valueInput, SECRET_VALUE);
    await user.click(screen.getByTestId("factory-vault-submit"));

    await waitFor(() =>
      expect(SecretsService.createSecret).toHaveBeenCalledWith(
        buildFactorySecretName(FACTORY_ID, "GITHUB_TOKEN"),
        SECRET_VALUE,
        undefined,
      ),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("factory-vault-form")).toBeNull(),
    );
    expect(document.body.textContent).not.toContain(SECRET_VALUE);
    logSpies.forEach((spy) =>
      expect(JSON.stringify(spy.mock.calls)).not.toContain(SECRET_VALUE),
    );
    logSpies.forEach((spy) => spy.mockRestore());
  });

  it("asks for confirmation before deleting an entry", async () => {
    const user = userEvent.setup();
    const stored = buildFactorySecretName(FACTORY_ID, "GITHUB_TOKEN")!;
    vi.mocked(SecretsService.getSecrets).mockResolvedValue([{ name: stored }]);
    vi.mocked(SecretsService.deleteSecret).mockResolvedValue(undefined);
    renderSection("vault");

    await user.click(await screen.findByTestId("factory-vault-delete"));
    expect(SecretsService.deleteSecret).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("factory-vault-confirm-delete"));

    await waitFor(() =>
      expect(SecretsService.deleteSecret).toHaveBeenCalledWith(stored),
    );
  });
});

// These cover the simulated team, which is opt-in.
vitestDemoOn.beforeEach(() =>
  window.history.pushState({}, "", "/?demoTeam=on"),
);
vitestDemoOn.afterEach(() => window.history.pushState({}, "", "/"));

describe("factory team section", () => {
  const openTemplate = async (
    user: ReturnType<typeof userEvent.setup>,
    id: string,
  ) => {
    await user.click(screen.getByTestId(`team-template-use-${id}`));
    return screen.getByTestId("team-template-modal");
  };

  beforeEach(() => {
    useFeedFactoriesStore.setState({ humanAssignments: {} });
  });

  it("puts Team after Agents and before Projects in the section nav", () => {
    renderSection();

    const ids = Array.from(
      document.querySelectorAll('[data-testid^="factory-navigation-"]'),
    ).map((node) =>
      node.getAttribute("data-testid")?.replace("factory-navigation-", ""),
    );
    const unique = [...new Set(ids)];
    expect(unique.indexOf("team")).toBe(unique.indexOf("agents") + 1);
    expect(unique.indexOf("projects")).toBe(unique.indexOf("team") + 1);
  });

  it("shows an honest empty state and zero coverage with no invitees", () => {
    renderSection("team");

    expect(screen.getByTestId("factory-team-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("factory-team-member")).toBeNull();
    expect(
      within(screen.getByTestId("team-template-design-review")).getAllByRole(
        "listitem",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByTestId("team-template-coverage-design-review"),
    ).toHaveTextContent("FACTORY$HUMAN_ROLES_FILLED");
    expect(screen.getByTestId("factory-team-summary")).toHaveTextContent(
      "FACTORY$TEAM_SUMMARY",
    );
  });

  it("saves template invites that persist across rehydration and raise coverage", async () => {
    const user = userEvent.setup();
    renderSection("team");

    await openTemplate(user, "design-review");
    expect(screen.getByTestId("team-template-save")).toBeDisabled();
    await user.type(
      screen.getByTestId("team-template-email-designer"),
      "dana@example.com",
    );
    await user.click(screen.getByTestId("team-template-save"));
    await user.click(screen.getByTestId("team-template-done"));

    const member = screen.getByTestId("factory-team-member");
    expect(member).toHaveTextContent("dana@example.com");
    expect(member).toHaveTextContent("FACTORY$HUMAN_ROLE_PENDING");
    expect(
      screen
        .getByTestId("team-template-design-review-role-designer")
        .getAttribute("data-filled"),
    ).toBe("true");

    // Simulate a reload: memory is lost, storage keeps what was written.
    const written = localStorage.getItem("feed-factories") ?? "";
    useFeedFactoriesStore.setState({ humanAssignments: {} });
    localStorage.setItem("feed-factories", written);
    await useFeedFactoriesStore.persist.rehydrate();
    expect(await screen.findByTestId("factory-team-member")).toHaveTextContent(
      "dana@example.com",
    );
  });

  it("skips roles that are already filled and rejects a bad email", async () => {
    const user = userEvent.setup();
    useFeedFactoriesStore.setState({
      humanAssignments: {
        [FACTORY_ID]: {
          "team:designer": [
            {
              id: "email:dana@example.com",
              status: "pending",
              name: "dana@example.com",
              email: "dana@example.com",
            },
          ],
        },
      },
    });
    renderSection("team");

    const modal = await openTemplate(user, "design-review");
    expect(
      within(modal).queryByTestId("team-template-row-designer"),
    ).toBeNull();
    expect(
      within(modal).getByTestId("team-template-row-reviewer"),
    ).toBeInTheDocument();
    await user.type(
      screen.getByTestId("team-template-email-reviewer"),
      "not-an-email",
    );
    expect(screen.getByTestId("team-template-save")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "FACTORY$INVITE_EMAIL_INVALID",
    );
  });

  it("removes a member from the team", async () => {
    const user = userEvent.setup();
    useFeedFactoriesStore.setState({
      humanAssignments: {
        [FACTORY_ID]: {
          "team:member": [
            {
              id: "email:lee@example.com",
              status: "pending",
              name: "Lee",
              email: "lee@example.com",
            },
          ],
        },
      },
    });
    renderSection("team");

    await user.click(
      screen.getByRole("button", { name: "FACTORY$TEAM_REMOVE" }),
    );

    expect(screen.queryByTestId("factory-team-member")).toBeNull();
    expect(screen.getByTestId("factory-team-empty")).toBeInTheDocument();
  });
});
