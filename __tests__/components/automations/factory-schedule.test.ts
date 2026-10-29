import { describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { buildSchedule } from "#/components/features/automations/factory/factory-gantt";
import { ExecutionStatus } from "#/types/agent-server/core";
import { getFactoryIncoming } from "#/utils/factory-incoming-demo";

const DAY = 86_400_000;
const now = Date.parse("2026-08-10T12:00:00Z");

const conv = (id: string, overrides: Partial<AppConversation>) =>
  ({
    id,
    title: id,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-03T00:00:00Z",
    execution_status: ExecutionStatus.FINISHED,
    ...overrides,
  }) as unknown as AppConversation;

describe("buildSchedule", () => {
  it("runs a finished conversation to its last activity and a live one to now", () => {
    const rows = buildSchedule(
      [
        conv("done", {}),
        conv("live", { execution_status: ExecutionStatus.RUNNING }),
      ],
      now,
    ).flatMap((group) => group.rows);

    const done = rows.find((row) => row.id === "done")!;
    const live = rows.find((row) => row.id === "live")!;
    expect(done.end).toBe(Date.parse("2026-08-03T00:00:00Z"));
    expect(done.ongoing).toBe(false);
    expect(live.end).toBe(now);
    expect(live.ongoing).toBe(true);
  });

  it("gives a same-moment conversation a visible width and skips bad dates", () => {
    const rows = buildSchedule(
      [
        conv("flash", { updated_at: "2026-08-01T00:00:00Z" }),
        conv("bad", { created_at: "nope" }),
      ],
      now,
    ).flatMap((group) => group.rows);

    expect(rows).toHaveLength(1);
    expect(rows[0].end - rows[0].start).toBeGreaterThanOrEqual(DAY / 2);
  });
});

describe("getFactoryIncoming", () => {
  it("is stable per factory and covers every source", () => {
    const first = getFactoryIncoming("web");
    expect(getFactoryIncoming("web")).toEqual(first);
    expect(new Set(first.map((item) => item.source))).toEqual(
      new Set(["linear", "jira", "github"]),
    );
  });
});
