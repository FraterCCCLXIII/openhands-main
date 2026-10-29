import { describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { pipelineCounts } from "#/components/features/automations/factory/pipeline-counts";
import {
  DEFAULT_PIPELINE_TEMPLATE_ID,
  PIPELINE_TEMPLATES,
} from "#/components/features/automations/factory/pipeline-templates";
import { ExecutionStatus } from "#/types/agent-server/core";

describe("pipeline templates", () => {
  it("has a default template and unique ids", () => {
    const ids = PIPELINE_TEMPLATES.map((template) => template.id);
    expect(ids).toContain(DEFAULT_PIPELINE_TEMPLATE_ID);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PIPELINE_TEMPLATES.map((template) => [template.name, template]))(
    "%s links only steps that exist, and every step is linked",
    (_name, template) => {
      const stepIds = new Set(template.steps.map((step) => step.id));
      expect(stepIds.size).toBe(template.steps.length);

      template.links.forEach((link) => {
        expect(stepIds).toContain(link.source);
        expect(stepIds).toContain(link.target);
      });

      const linked = new Set(
        template.links.flatMap((link) => [link.source, link.target]),
      );
      template.steps.forEach((step) => expect(linked).toContain(step.id));
    },
  );
});

describe("pipelineCounts", () => {
  const conv = (overrides: Partial<AppConversation>) =>
    ({ id: "c", pr_number: [], ...overrides }) as unknown as AppConversation;

  it("counts all, live and pull-request conversations", () => {
    expect(
      pipelineCounts([
        conv({ execution_status: ExecutionStatus.RUNNING, pr_number: [1] }),
        conv({ execution_status: ExecutionStatus.IDLE, pr_number: [2, 3] }),
        conv({ execution_status: ExecutionStatus.IDLE }),
      ]),
    ).toEqual({ conversations: 3, live: 1, prs: 2 });
  });

  it("is all zeros for an empty factory", () => {
    expect(pipelineCounts([])).toEqual({ conversations: 0, live: 0, prs: 0 });
  });
});
