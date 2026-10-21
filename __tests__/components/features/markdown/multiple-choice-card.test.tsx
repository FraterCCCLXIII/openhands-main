import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { code as Code } from "#/components/features/markdown/code";

const { sendMessageMock } = vi.hoisted(() => ({
  sendMessageMock: vi.fn(),
}));

vi.mock("#/contexts/conversation-websocket-context", () => ({
  useConversationWebSocket: () => ({ sendMessage: sendMessageMock }),
}));

const choiceSource = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    question: "Which version should I merge?",
    options: [
      { label: "Option A", description: "The first one" },
      { label: "Compare first" },
    ],
    ...overrides,
  });

const invalidSource = JSON.stringify({ question: "Only" });

const renderChoice = (overrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <Code className="language-choice">{choiceSource(overrides)}</Code>,
  );

const submitButton = () => screen.getByRole("button", { name: /SUBMIT/ });
const skipButton = () => screen.getByRole("button", { name: /SKIP$/ });

const sentText = () =>
  sendMessageMock.mock.calls[0][0].content[0].text as string;

describe("MultipleChoiceCard via markdown code", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    sendMessageMock.mockResolvedValue({ queued: false });
  });

  it("renders the question and options as a radio group", () => {
    renderChoice();

    expect(screen.getByText("Which version should I merge?")).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByText("The first one")).toBeVisible();
  });

  it("falls back to a normal code block for an invalid template", () => {
    renderWithProviders(
      <Code className="language-choice">{invalidSource}</Code>,
    );

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText(/"question"/)).toBeInTheDocument();
  });

  it("enables Submit once an option is chosen and sends its label", async () => {
    const user = userEvent.setup();
    renderChoice();
    expect(submitButton()).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Option A/ }));
    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sentText()).toBe("Option A");
  });

  it("submits with Ctrl+Enter", async () => {
    const user = userEvent.setup();
    renderChoice();

    await user.click(screen.getByRole("radio", { name: /Compare first/ }));
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(sentText()).toBe("Compare first");
  });

  it("requires text for Other before Submit is enabled", async () => {
    const user = userEvent.setup();
    renderChoice({ allowOther: true });

    await user.click(screen.getByRole("radio", { name: /OTHER/ }));
    expect(submitButton()).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "Something else");
    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(sentText()).toBe("Something else");
  });

  it("sends the skip message when Skip is pressed", async () => {
    const user = userEvent.setup();
    renderChoice();

    await user.click(skipButton());

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sentText()).toMatch(/SKIP_MESSAGE/);
  });

  it("becomes read-only and shows the answer after submit", async () => {
    const user = userEvent.setup();
    renderChoice();

    await user.click(screen.getByRole("radio", { name: /Option A/ }));
    await user.click(submitButton());

    expect(await screen.findByRole("status")).toHaveTextContent(/ANSWERED/);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    screen.getAllByRole("radio").forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });
});
