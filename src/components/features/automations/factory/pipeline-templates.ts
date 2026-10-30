/** How a step is run: by a person, by agents alone, or a system they read. */
export type PipelineStepKind = "human" | "auto" | "system";

/** Which live figure a step shows, drawn from the factory's conversations. */
export type PipelineCountKind = "conversations" | "live" | "prs";

import { DEFAULT_HUMAN_ROLES } from "#/constants/factory-human-roles";

/** The part a person plays at a human-in-the-loop gate; names the slot. */
export type HumanRoleKind = "reviewer" | "approver" | "signer";

export interface PipelineStep {
  id: string;
  kind: PipelineStepKind;
  /**
   * True only for a gate a person must pass (review, approval, sign-off).
   * Trigger steps that merely start the flow are not gates.
   */
  humanInTheLoop?: boolean;
  /** What the people at this gate are called. Set with `humanInTheLoop`. */
  humanRoleKind?: HumanRoleKind;
  /** How many people this gate asks for until the factory changes it. */
  defaultHumanRoles?: number;
  /** Position on the canvas, in pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  lines: string[];
  count?: PipelineCountKind;
}

export interface PipelineLink {
  source: string;
  target: string;
  /** A dashed link carries context or a feedback loop, not the main flow. */
  dashed?: boolean;
  label?: string;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  links: PipelineLink[];
}

const step = (
  id: string,
  kind: PipelineStepKind,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  lines: string[] = [],
  count?: PipelineCountKind,
): PipelineStep => ({ id, kind, x, y, width, height, title, lines, count });

/** Marks a human step as a gate and says who staffs it. */
const gate = (
  base: PipelineStep,
  humanRoleKind: HumanRoleKind,
  defaultHumanRoles = DEFAULT_HUMAN_ROLES,
): PipelineStep => ({
  ...base,
  humanInTheLoop: true,
  humanRoleKind,
  defaultHumanRoles,
});

/** The agentic software delivery flow from the Projects hub, as a template. */
const AGENTIC_SDLC: PipelineTemplate = {
  id: "agentic-sdlc",
  name: "Agentic SDLC",
  description:
    "From a trigger to production: plan, code, CI, agentic review, deploy and monitoring, with humans where risk is higher.",
  steps: [
    step("t1", "human", 20, 0, 220, 54, "Monitoring signals", [
      "Defines issue",
    ]),
    step("t2", "human", 255, 0, 220, 54, "Jira ticket assigned", [
      "Defines outcome or issue",
    ]),
    step("t3", "human", 490, 0, 220, 54, "Slack message @tag", [
      "Defines outcome",
    ]),
    step("t4", "human", 725, 0, 220, 54, "Software builder", [
      "Defines outcome",
    ]),
    step("ticket", "auto", 40, 110, 340, 62, "Ticket", [], "conversations"),
    gate(
      step("hitl1", "human", 40, 200, 340, 56, "HITL review first", [
        "Elevated to autonomous later",
      ]),
      "reviewer",
    ),
    step("plan", "auto", 40, 290, 340, 82, "Plan agent", [
      "Defines implementation spec (architect agent)",
    ]),
    gate(
      step("hitl2", "human", 40, 400, 340, 56, "HITL review first", [
        "Elevated to autonomous later",
      ]),
      "reviewer",
    ),
    step(
      "code",
      "auto",
      40,
      490,
      340,
      92,
      "Coding agents",
      ["Writes and edits the code (developer agent)"],
      "live",
    ),
    step("ci", "auto", 70, 620, 280, 96, "CI: build and test", [
      "Hardened for agent-scale load",
      "Performance testing",
    ]),
    step("sys", "system", 560, 250, 400, 190, "Internal systems", [
      "Source code and docs",
      "GitHub · Google Docs · Lucid",
      "Slack · Confluence wiki",
      "Internal skills and plugins",
    ]),
    step(
      "review",
      "auto",
      560,
      480,
      400,
      120,
      "Agentic code review",
      ["Parallel review: security, quality, standards", "Risk classification"],
      "prs",
    ),
    step("risk", "auto", 660, 640, 200, 84, "Low-risk change?"),
    gate(
      step("eng", "human", 790, 760, 170, 84, "Code review", [
        "Additional review by an engineer",
      ]),
      "reviewer",
    ),
    step("deploy", "auto", 560, 880, 400, 96, "Agentic deploy", [
      "Babysits the change into prod, including feature flag rollout",
    ]),
    step("prod", "auto", 40, 760, 440, 96, "Production", [
      "Agent watches graphs, signals and alerts",
    ]),
    step("perf", "auto", 40, 900, 260, 96, "Performance monitoring agent", [
      "Detects latency regressions",
    ]),
    step("sre", "auto", 320, 900, 220, 96, "SRE bot", [
      "Investigates incidents, proposes mitigations",
    ]),
  ],
  links: [
    { source: "t1", target: "ticket" },
    { source: "t2", target: "ticket" },
    { source: "t3", target: "ticket" },
    { source: "t4", target: "ticket" },
    { source: "ticket", target: "hitl1" },
    { source: "hitl1", target: "plan" },
    { source: "plan", target: "hitl2" },
    { source: "hitl2", target: "code" },
    { source: "sys", target: "plan", dashed: true, label: "context" },
    { source: "sys", target: "code", dashed: true, label: "context" },
    { source: "code", target: "ci" },
    { source: "ci", target: "review" },
    { source: "ci", target: "code", dashed: true, label: "fix until green" },
    { source: "sys", target: "review", dashed: true, label: "context" },
    { source: "review", target: "risk" },
    { source: "risk", target: "deploy", label: "yes" },
    { source: "risk", target: "eng", label: "no" },
    { source: "eng", target: "deploy" },
    { source: "deploy", target: "prod" },
    { source: "prod", target: "perf", dashed: true, label: "monitors" },
    { source: "prod", target: "sre", label: "outage" },
    { source: "perf", target: "t1", dashed: true, label: "proposes fixes" },
  ],
};

const INCIDENT_RESPONSE: PipelineTemplate = {
  id: "incident-response",
  name: "Incident response",
  description:
    "An alert fires, an agent triages and proposes a mitigation, a person approves, and a fix and postmortem follow.",
  steps: [
    step("alert", "system", 0, 120, 220, 80, "Alert fires", [
      "PagerDuty · Datadog",
    ]),
    step(
      "triage",
      "auto",
      280,
      120,
      240,
      90,
      "Triage agent",
      ["Groups alerts, finds the likely cause"],
      "conversations",
    ),
    gate(
      step("approve", "human", 580, 120, 240, 80, "On-call approval", [
        "Approves the mitigation",
      ]),
      "approver",
    ),
    step(
      "mitigate",
      "auto",
      880,
      120,
      240,
      90,
      "Mitigation agent",
      ["Rolls back or flips a flag"],
      "live",
    ),
    step(
      "fix",
      "auto",
      580,
      300,
      240,
      90,
      "Fix agent",
      ["Opens a pull request for the root cause"],
      "prs",
    ),
    step("verify", "auto", 280, 300, 240, 90, "Verifier", [
      "Checks the fix against the incident",
    ]),
    gate(
      step("post", "human", 0, 300, 220, 80, "Postmortem", [
        "Owner reviews the draft",
      ]),
      "reviewer",
    ),
  ],
  links: [
    { source: "alert", target: "triage" },
    { source: "triage", target: "approve" },
    { source: "approve", target: "mitigate", label: "approved" },
    { source: "mitigate", target: "fix" },
    { source: "fix", target: "verify" },
    { source: "verify", target: "post" },
    { source: "verify", target: "fix", dashed: true, label: "not fixed" },
  ],
};

const RELEASE_TRAIN: PipelineTemplate = {
  id: "release-train",
  name: "Release train",
  description:
    "A scheduled train collects merged work, verifies it, rolls it out in stages and watches the result.",
  steps: [
    step(
      "cut",
      "auto",
      0,
      100,
      220,
      84,
      "Cut release",
      ["Collects merged pull requests"],
      "prs",
    ),
    step(
      "verify",
      "auto",
      280,
      100,
      240,
      84,
      "Verification agents",
      ["Regression and smoke tests"],
      "live",
    ),
    gate(
      step("signoff", "human", 580, 100, 220, 84, "Release sign-off", [
        "Release manager approves",
      ]),
      "signer",
      2,
    ),
    step("canary", "auto", 860, 100, 220, 84, "Canary rollout", [
      "1% then 10% then 50%",
    ]),
    step("full", "auto", 860, 260, 220, 84, "Full rollout", [
      "Feature flags on",
    ]),
    step("watch", "auto", 580, 260, 220, 84, "Watch agent", [
      "Error rate and latency",
    ]),
    step(
      "notes",
      "auto",
      280,
      260,
      240,
      84,
      "Release notes",
      ["Drafts the changelog"],
      "conversations",
    ),
  ],
  links: [
    { source: "cut", target: "verify" },
    { source: "verify", target: "signoff" },
    { source: "signoff", target: "canary" },
    { source: "canary", target: "full" },
    { source: "full", target: "watch" },
    { source: "watch", target: "notes" },
    { source: "watch", target: "canary", dashed: true, label: "roll back" },
  ],
};

const DATA_QUALITY: PipelineTemplate = {
  id: "data-quality",
  name: "Data quality",
  description:
    "Ingested data is validated by agents, bad batches are quarantined, and fixes are proposed before publishing.",
  steps: [
    step("ingest", "system", 0, 100, 220, 84, "Ingest", ["Warehouse loads"]),
    step(
      "validate",
      "auto",
      280,
      100,
      240,
      84,
      "Validation agents",
      ["Schema, nulls, drift"],
      "conversations",
    ),
    step("quarantine", "auto", 580, 20, 220, 84, "Quarantine", [
      "Holds bad batches",
    ]),
    step(
      "fix",
      "auto",
      860,
      20,
      220,
      84,
      "Fix proposal",
      ["Opens a pull request"],
      "prs",
    ),
    gate(
      step("review", "human", 860, 180, 220, 84, "Data owner review", [
        "Approves the fix",
      ]),
      "reviewer",
    ),
    step(
      "publish",
      "auto",
      580,
      180,
      220,
      84,
      "Publish",
      ["Promotes to analytics"],
      "live",
    ),
  ],
  links: [
    { source: "ingest", target: "validate" },
    { source: "validate", target: "quarantine", label: "fails" },
    { source: "validate", target: "publish", label: "passes" },
    { source: "quarantine", target: "fix" },
    { source: "fix", target: "review" },
    { source: "review", target: "publish" },
  ],
};

export const PIPELINE_TEMPLATES: readonly PipelineTemplate[] = [
  AGENTIC_SDLC,
  INCIDENT_RESPONSE,
  RELEASE_TRAIN,
  DATA_QUALITY,
];

export const DEFAULT_PIPELINE_TEMPLATE_ID = AGENTIC_SDLC.id;
