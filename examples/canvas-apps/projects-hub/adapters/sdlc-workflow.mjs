// SDLC Workflow for OpenHands - the "darkfactory" queue management
// Routes items through design → development → review → merge pipeline
import { execFileSync } from "node:child_process";
import { PR_RULES, SDLC_STATUSES, PR_CHECKLIST, validatePR, getSDLCStatus, getRequiredActions } from "./pr-rules.mjs";

export const NAME = "sdlc";

/**
 * SDLC Pipeline stages
 */
export const PIPELINE_STAGES = [
  { id: "intake", name: "Intake", description: "New issues awaiting triage" },
  { id: "design", name: "Design", description: "Needs design work or spec" },
  { id: "ready", name: "Ready", description: "Ready for development" },
  { id: "building", name: "Building", description: "In active development" },
  { id: "review", name: "Review", description: "PR open, awaiting review" },
  { id: "verify", name: "Verify", description: "Needs evidence or final checks" },
  { id: "done", name: "Done", description: "Merged or closed" },
];

/**
 * Map card status to pipeline stage
 */
export function getPipelineStage(card) {
  const { status } = getSDLCStatus(card.labels || []);
  
  switch (status) {
    case "backlog":
    case "needsSpec":
      return "intake";
    case "needsDesign":
      return "design";
    case "readyForDev":
      return "ready";
    case "inProgress":
      return "building";
    case "needsReview":
      return "review";
    case "needsEvidence":
    case "blocked":
    case "needsDecision":
      return "verify";
    case "done":
      return "done";
    default:
      return "intake";
  }
}

/**
 * Queue item with PR validation status
 */
export function enrichCardWithPRStatus(card, prs = []) {
  const linkedPR = prs.find(pr => {
    const closes = pr.closingIssuesReferences || [];
    return closes.some(ref => `GH.${ref.number}` === card.id);
  });
  
  if (!linkedPR) {
    return {
      ...card,
      prStatus: null,
      prValidation: null,
      pipeline: getPipelineStage(card),
    };
  }
  
  const validation = validatePR(linkedPR, { labels: card.labels });
  
  return {
    ...card,
    prStatus: {
      number: linkedPR.number,
      state: linkedPR.state,
      isDraft: linkedPR.isDraft,
      url: linkedPR.url,
      title: linkedPR.title,
    },
    prValidation: validation,
    pipeline: getPipelineStage(card),
    nextActions: getRequiredActions(card),
  };
}

/**
 * Filter cards by assignee (for "My Work" view)
 */
export function filterByAssignee(cards, username) {
  return cards.filter(card => {
    const assignees = card.assignees || [];
    return assignees.some(a => 
      (a.login || a.name || a).toLowerCase() === username.toLowerCase()
    );
  });
}

/**
 * Filter cards by @mention (for "@Mentioned" view)
 */
export function filterByMention(cards, username) {
  return cards.filter(card => {
    const body = card.body || card.description || "";
    const title = card.title || "";
    const pattern = new RegExp(`@${username}\\b`, "i");
    return pattern.test(body) || pattern.test(title);
  });
}

/**
 * Filter cards by labels (for "Product", "Needs Design", etc.)
 */
export function filterByLabels(cards, labelPatterns) {
  const patterns = labelPatterns.map(p => p.toLowerCase());
  return cards.filter(card => {
    const labels = (card.labels || []).map(l => (l.name || l).toLowerCase());
    return patterns.some(p => labels.includes(p));
  });
}

/**
 * Default filter views for the SDLC dashboard
 */
export const FILTER_VIEWS = [
  {
    id: "my-work",
    name: "My Work",
    icon: "👤",
    filter: (cards, ctx) => filterByAssignee(cards, ctx.username),
    description: "Items assigned to you",
  },
  {
    id: "mentioned",
    name: "@Mentioned",
    icon: "📢",
    filter: (cards, ctx) => filterByMention(cards, ctx.username),
    description: "Items where you're @mentioned",
  },
  {
    id: "product",
    name: "Product",
    icon: "📦",
    filter: (cards) => filterByLabels(cards, ["product", "feature", "enhancement"]),
    description: "Product features and enhancements",
  },
  {
    id: "needs-design",
    name: "Needs Design",
    icon: "🎨",
    filter: (cards) => filterByLabels(cards, ["needs-design", "design", "ux", "ui"]),
    description: "Items waiting for design work",
  },
  {
    id: "bugs",
    name: "Bugs",
    icon: "🐛",
    filter: (cards) => filterByLabels(cards, ["bug", "defect", "fix"]),
    description: "Bug reports and fixes",
  },
  {
    id: "blocked",
    name: "Blocked",
    icon: "🚫",
    filter: (cards) => {
      return cards.filter(c => {
        const { status } = getSDLCStatus(c.labels || []);
        return status === "blocked" || status === "needsDecision";
      });
    },
    description: "Items blocked or needing decisions",
  },
  {
    id: "needs-evidence",
    name: "Needs Evidence",
    icon: "📸",
    filter: (cards) => filterByLabels(cards, ["needs-evidence", "needs-screenshots", "needs-video"]),
    description: "PRs missing visual evidence",
  },
  {
    id: "ready-for-merge",
    name: "Ready to Merge",
    icon: "✅",
    filter: (cards) => {
      return cards.filter(c => {
        if (!c.prValidation) return false;
        return c.prValidation.valid && c.prStatus?.state === "OPEN" && !c.prStatus?.isDraft;
      });
    },
    description: "PRs that pass all validation checks",
  },
];

/**
 * Create a design issue from the dashboard
 * Returns the command to run or API call to make
 */
export function createDesignIssue({ title, description, labels = [], assignees = [], repo }) {
  const issueLabels = ["needs-design", ...labels];
  const body = `## Design Request

${description}

---

### Design Checklist
- [ ] User flow documented
- [ ] Wireframes/mockups created
- [ ] Acceptance criteria defined
- [ ] Edge cases identified
- [ ] Accessibility considered

### Next Steps
Once design is approved:
1. Remove \`needs-design\` label
2. Add \`ready-for-dev\` label
3. Link design doc in description

---
*Created via SDLC Dashboard*
`;

  return {
    command: "gh",
    args: [
      "issue", "create",
      "--repo", repo,
      "--title", title,
      "--body", body,
      "--label", issueLabels.join(","),
      ...(assignees.length ? ["--assignee", assignees.join(",")] : []),
    ],
  };
}

/**
 * Automation triggers for the SDLC pipeline
 */
export const AUTOMATION_TRIGGERS = {
  // When issue gets ready-for-dev label
  onReadyForDev: {
    event: "issues.labeled",
    filter: "contains(issue.labels[].name, 'ready-for-dev')",
    action: "Notify assignee, add to sprint",
  },
  
  // When PR is opened
  onPROpened: {
    event: "pull_request.opened",
    action: "Validate PR template, check issue link, add to review queue",
  },
  
  // When PR needs evidence
  onNeedsEvidence: {
    event: "pull_request.labeled",
    filter: "contains(pull_request.labels[].name, 'needs-evidence')",
    action: "Comment with evidence requirements, notify author",
  },
  
  // When PR is ready for review
  onReadyForReview: {
    event: "pull_request.ready_for_review",
    action: "Validate all checklist items, request reviewers",
  },
  
  // When PR is merged
  onPRMerged: {
    event: "pull_request.closed",
    filter: "pull_request.merged == true",
    action: "Update linked issue, track metrics",
  },
};

/**
 * Get pipeline statistics
 */
export function getPipelineStats(cards) {
  const stats = {
    total: cards.length,
    byStage: {},
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    withPR: 0,
    validPRs: 0,
    blocked: 0,
    avgAge: 0,
  };
  
  for (const stage of PIPELINE_STAGES) {
    stats.byStage[stage.id] = 0;
  }
  
  let totalAge = 0;
  const now = Date.now();
  
  for (const card of cards) {
    const stage = getPipelineStage(card);
    stats.byStage[stage]++;
    
    if (card.tier === 1) stats.byPriority.urgent++;
    else if (card.tier === 2) stats.byPriority.high++;
    else if (card.tier === 3) stats.byPriority.medium++;
    else stats.byPriority.low++;
    
    if (card.prStatus) {
      stats.withPR++;
      if (card.prValidation?.valid) stats.validPRs++;
    }
    
    const { status } = getSDLCStatus(card.labels || []);
    if (status === "blocked" || status === "needsDecision") {
      stats.blocked++;
    }
    
    if (card.createdAt) {
      totalAge += now - new Date(card.createdAt).getTime();
    }
  }
  
  stats.avgAge = cards.length ? Math.round(totalAge / cards.length / (1000 * 60 * 60 * 24)) : 0;
  
  return stats;
}

export default {
  NAME,
  PIPELINE_STAGES,
  FILTER_VIEWS,
  AUTOMATION_TRIGGERS,
  PR_RULES,
  PR_CHECKLIST,
  getPipelineStage,
  enrichCardWithPRStatus,
  filterByAssignee,
  filterByMention,
  filterByLabels,
  validatePR,
  getSDLCStatus,
  getRequiredActions,
  createDesignIssue,
  getPipelineStats,
};
