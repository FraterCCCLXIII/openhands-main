import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedFactoryHeader } from "#/components/features/feed/feed-factory-header";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core";
import {
  FEED_FACTORIES,
  getFeedFactory,
  getFeedPerson,
} from "#/utils/feed-team-demo";
import { renderWithProviders } from "../../../../test-utils";

// The global mock drops interpolation; keep the values so counts are visible.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));

const [factory, other] = FEED_FACTORIES;

// Conversation ids hash to a simulated factory, so look one up per factory.
const idFor = (factoryId: string, nth: number): string => {
  const matches: string[] = [];
  for (let i = 0; matches.length <= nth; i += 1) {
    if (getFeedFactory(`c${i}`).id === factoryId) matches.push(`c${i}`);
  }
  return matches[nth];
};

const conv = (
  id: string,
  overrides: Partial<AppConversation> = {},
): AppConversation =>
  ({
    id,
    title: id,
    selected_repository: null,
    updated_at: "2026-08-01T12:00:00.000Z",
    execution_status: ExecutionStatus.IDLE,
    ...overrides,
  }) as unknown as AppConversation;

describe("FeedFactoryHeader", () => {
  it("shows the factory and numbers for its own conversations only", () => {
    renderWithProviders(
      <FeedFactoryHeader
        factory={factory}
        conversations={[
          conv(idFor(factory.id, 0), {
            selected_repository: "acme/app",
            execution_status: ExecutionStatus.RUNNING,
          }),
          conv(idFor(factory.id, 1), { selected_repository: "acme/site" }),
          conv(idFor(other.id, 0), {
            execution_status: ExecutionStatus.RUNNING,
          }),
        ]}
      />,
    );

    expect(screen.getByTestId("feed-factory-name")).toHaveTextContent(
      factory.name,
    );
    expect(screen.getByTestId("feed-factory-description")).toHaveTextContent(
      factory.description,
    );
    expect(screen.getByTestId("feed-factory-owner")).toHaveTextContent(
      getFeedPerson(factory.ownerId)!.name,
    );
    expect(screen.getByTestId("feed-factory-conversations")).toHaveTextContent(
      `${I18nKey.FEED$FACTORY_CONVERSATIONS}:2`,
    );
    expect(screen.getByTestId("feed-factory-live")).toHaveTextContent(
      `${I18nKey.FEED$FACTORY_LIVE}:1`,
    );
    expect(screen.getByTestId("feed-factory-projects")).toHaveTextContent(
      `${I18nKey.FEED$FACTORY_PROJECTS}:2`,
    );
  });

  it("leaves out last activity when the factory has no conversations", () => {
    renderWithProviders(
      <FeedFactoryHeader factory={factory} conversations={[]} />,
    );
    expect(screen.getByTestId("feed-factory-conversations")).toHaveTextContent(
      `${I18nKey.FEED$FACTORY_CONVERSATIONS}:0`,
    );
    expect(
      screen.queryByTestId("feed-factory-last-activity"),
    ).not.toBeInTheDocument();
  });
});
