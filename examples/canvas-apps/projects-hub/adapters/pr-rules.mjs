// PR validation rules for OpenHands repositories
// These rules are enforced when items move through the SDLC queue

/**
 * OpenHands PR requirements from AGENTS.md and .agents/skills/custom-codereview-guide.md
 */
export const PR_RULES = {
  // Required sections in PR description
  requiredSections: [
    { id: "issue", pattern: /Fixes #\d+/, message: "Must link to an issue with `Fixes #XXX`" },
    { id: "why", pattern: /## Why[\s\S]*?\S/, message: "Must include a Why section explaining motivation" },
    { id: "summary", pattern: /## Summary[\s\S]*?-\s*\S/, message: "Must include Summary bullets" },
    { id: "howToTest", pattern: /## How to Test[\s\S]*?\S/, message: "Must include How to Test steps" },
    { id: "type", pattern: /- \[x\] (Bug fix|Feature|Refactor|Breaking change|Docs \/ chore)/, message: "Must check at least one Type checkbox" },
  ],

  // Visual evidence requirements
  visualEvidence: {
    required: true,
    exemptTypes: ["Docs / chore"],
    patterns: [
      /!\[.*?\]\(.*?\.(png|jpg|jpeg|gif|webp|mp4|mov|webm)/i,
      /https:\/\/.*\.(png|jpg|jpeg|gif|webp|mp4|mov|webm)/i,
      /https:\/\/github\.com\/.*\/assets\//,
      /<video/i,
      /<img/i,
    ],
    message: "Functional changes require screenshots/video of running Canvas",
  },

  // Issue requirements
  issueRequirements: {
    requiredLabel: "ready-for-dev",
    message: "Linked issue must have `ready-for-dev` label",
  },

  // Repository ownership rules
  repositoryOwnership: {
    "OpenHands/OpenHands": ["Agent Canvas UI", "frontend state", "backend selection", "local-stack orchestration"],
    "OpenHands/software-agent-sdk": ["Agent Server", "SDK", "canonical server API", "TypeScript client"],
    "OpenHands/extensions": ["reusable skills", "plugins", "integrations"],
    "OpenHands/automation": ["scheduling", "webhooks", "run history", "automation dispatch"],
  },

  // Code quality rules
  codeQuality: {
    noDirectAgentServerCalls: {
      pattern: /(?:fetch|axios|got)\s*\(\s*['"`].*\/api\/(conversations|agent|files|bash)/,
      message: "Use @openhands/typescript-client instead of direct Agent Server calls",
    },
    i18nCompleteness: {
      command: "npm run check-translation-completeness",
      message: "All i18n keys must have translations in all locales",
    },
  },

  // Human section rule
  humanSection: {
    pattern: /HUMAN:\s*\n\s*\n/,
    message: "HUMAN section must be filled by a human contributor, not AI",
  },
};

/**
 * Status labels for SDLC workflow
 */
export const SDLC_STATUSES = {
  // Pre-development
  backlog: { labels: ["backlog", "icebox", "triage"], color: "#6b7280" },
  needsDesign: { labels: ["needs-design", "design", "ux", "ui"], color: "#8b5cf6" },
  needsSpec: { labels: ["needs-spec", "needs-requirements", "needs-acceptance-criteria"], color: "#f59e0b" },
  
  // Ready for work  
  readyForDev: { labels: ["ready-for-dev", "ready"], color: "#22c55e" },
  
  // In progress
  inProgress: { labels: ["in-progress", "wip", "claimed"], color: "#3b82f6" },
  
  // Review
  needsReview: { labels: ["needs-review", "in-review", "ready-for-review"], color: "#a855f7" },
  needsEvidence: { labels: ["needs-evidence", "needs-screenshots", "needs-video"], color: "#ef4444" },
  
  // Blocked
  blocked: { labels: ["blocked", "on-hold", "waiting"], color: "#dc2626" },
  needsDecision: { labels: ["needs-decision", "question", "needs-discussion"], color: "#f97316" },
  
  // Done
  done: { labels: ["done", "merged", "closed"], color: "#16a34a" },
};

/**
 * Validate a PR against the rules
 * @param {object} pr - PR data from GitHub API
 * @param {object} issue - Linked issue data
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validatePR(pr, issue = null) {
  const errors = [];
  const warnings = [];
  const body = pr.body || "";

  // Check required sections
  for (const section of PR_RULES.requiredSections) {
    if (!section.pattern.test(body)) {
      errors.push(`[${section.id}] ${section.message}`);
    }
  }

  // Check visual evidence (unless exempt type)
  const isExempt = PR_RULES.visualEvidence.exemptTypes.some(type => 
    new RegExp(`- \\[x\\] ${type}`).test(body)
  );
  if (!isExempt && PR_RULES.visualEvidence.required) {
    const hasEvidence = PR_RULES.visualEvidence.patterns.some(p => p.test(body));
    if (!hasEvidence) {
      errors.push(`[evidence] ${PR_RULES.visualEvidence.message}`);
    }
  }

  // Check linked issue
  if (issue) {
    const labels = (issue.labels || []).map(l => l.name || l);
    if (!labels.includes(PR_RULES.issueRequirements.requiredLabel)) {
      errors.push(`[issue] ${PR_RULES.issueRequirements.message}`);
    }
  }

  // Check HUMAN section (warn if empty after "HUMAN:")
  if (PR_RULES.humanSection.pattern.test(body)) {
    warnings.push(`[human] ${PR_RULES.humanSection.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Determine SDLC status from labels
 * @param {string[]} labels - Array of label names
 * @returns {{ status: string, color: string }}
 */
export function getSDLCStatus(labels) {
  const lower = labels.map(l => l.toLowerCase());
  
  for (const [status, config] of Object.entries(SDLC_STATUSES)) {
    if (config.labels.some(l => lower.includes(l.toLowerCase()))) {
      return { status, color: config.color };
    }
  }
  
  return { status: "backlog", color: SDLC_STATUSES.backlog.color };
}

/**
 * Get required actions for a card to move to the next stage
 * @param {object} card - Card from the snapshot
 * @returns {string[]} - List of required actions
 */
export function getRequiredActions(card) {
  const actions = [];
  const labels = card.labels || [];
  const { status } = getSDLCStatus(labels);

  switch (status) {
    case "backlog":
      actions.push("Add `ready-for-dev` label when acceptance criteria are defined");
      break;
    case "needsDesign":
      actions.push("Complete design and add design doc link");
      actions.push("Remove `needs-design` label when design is approved");
      break;
    case "needsSpec":
      actions.push("Add acceptance criteria to issue");
      actions.push("Add `ready-for-dev` label when requirements are clear");
      break;
    case "readyForDev":
      actions.push("Claim the issue (assign yourself)");
      actions.push("Add `in-progress` label when starting");
      break;
    case "inProgress":
      actions.push("Open PR linking to the issue with `Fixes #XXX`");
      actions.push("Fill out PR template sections");
      actions.push("Add screenshots/video evidence");
      break;
    case "needsReview":
      actions.push("Address review comments");
      actions.push("Ensure all CI checks pass");
      break;
    case "needsEvidence":
      actions.push("Add screenshots showing before/after behavior");
      actions.push("For bugs: demonstrate failure before and success after");
      break;
    case "blocked":
      actions.push("Identify and resolve blocker");
      actions.push("Update issue with blocker status");
      break;
    case "needsDecision":
      actions.push("Escalate to maintainer for decision");
      actions.push("Document decision in issue comments");
      break;
  }

  return actions;
}

/**
 * PR checklist for the SDLC queue
 */
export const PR_CHECKLIST = [
  { id: "issue-linked", text: "Issue linked with `Fixes #XXX`", required: true },
  { id: "issue-ready-for-dev", text: "Linked issue has `ready-for-dev` label", required: true },
  { id: "why-section", text: "Why section explains motivation", required: true },
  { id: "summary-bullets", text: "Summary has 1-3 bullets", required: true },
  { id: "how-to-test", text: "How to Test section has reproduction steps", required: true },
  { id: "type-checked", text: "Type checkbox is checked", required: true },
  { id: "visual-evidence", text: "Screenshots/video of running Canvas", required: true, exemptTypes: ["Docs / chore"] },
  { id: "before-after", text: "Bug fixes show before/after", required: false, forTypes: ["Bug fix"] },
  { id: "human-section", text: "HUMAN section filled by human (not AI)", required: false },
  { id: "design-doc", text: "Design doc linked for non-trivial changes", required: false },
  { id: "ci-passing", text: "All CI checks pass", required: true },
  { id: "no-conflicts", text: "No merge conflicts", required: true },
];

export default {
  PR_RULES,
  SDLC_STATUSES,
  PR_CHECKLIST,
  validatePR,
  getSDLCStatus,
  getRequiredActions,
};
