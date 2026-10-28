import { http, HttpResponse } from "msw";
import type { LocalPlugin, MarketplacePlugin } from "#/api/plugins-service";
import type { InstalledPluginInfo } from "#/api/plugins-management-service";

const MOCK_INSTALLED_AT = "2026-10-01T09:00:00Z";
const MOCK_MARKETPLACE_SOURCE = "github:OpenHands/extensions";

export const MOCK_MARKETPLACE_PLUGINS: MarketplacePlugin[] = [
  {
    name: "code-review",
    description: "Review diffs for correctness, style, and missing tests.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: true,
    skills: [{ name: "review-pr", description: "Review a pull request." }],
    files: ["plugin.json", "skills/review-pr.md"],
  },
  {
    name: "release-notes",
    description: "Draft release notes from merged pull requests.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: false,
    skills: [{ name: "release-notes", description: "Write release notes." }],
    files: ["plugin.json", "skills/release-notes.md"],
  },
  {
    name: "docs-writer",
    description: "Keep README and docs pages in sync with code changes.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: false,
    skills: [{ name: "update-docs", description: "Update docs for a change." }],
    files: ["plugin.json", "skills/update-docs.md"],
  },
  {
    name: "test-triage",
    description: "Group failing tests by root cause and suggest fixes.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: true,
    skills: [{ name: "triage-tests", description: "Triage failing tests." }],
    files: ["plugin.json", "skills/triage-tests.md"],
  },
  {
    name: "security-audit",
    description: "Scan dependencies and code for common security issues.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: false,
    skills: [{ name: "audit", description: "Run a security audit." }],
    files: ["plugin.json", "skills/audit.md"],
  },
  {
    name: "changelog-keeper",
    description: "Maintain CHANGELOG entries for every merged change.",
    source: MOCK_MARKETPLACE_SOURCE,
    installed: false,
    files: ["plugin.json"],
  },
];

export const MOCK_INSTALLED_PLUGINS: InstalledPluginInfo[] = [
  {
    name: "code-review",
    version: "1.2.0",
    description: "Review diffs for correctness, style, and missing tests.",
    enabled: true,
    source: MOCK_MARKETPLACE_SOURCE,
    installed_at: MOCK_INSTALLED_AT,
    install_path: "~/.openhands/plugins/code-review",
    skills: [{ name: "review-pr", description: "Review a pull request." }],
    files: ["plugin.json", "skills/review-pr.md"],
  },
  {
    name: "test-triage",
    version: "0.4.1",
    description: "Group failing tests by root cause and suggest fixes.",
    enabled: false,
    source: MOCK_MARKETPLACE_SOURCE,
    installed_at: MOCK_INSTALLED_AT,
    install_path: "~/.openhands/plugins/test-triage",
    skills: [{ name: "triage-tests", description: "Triage failing tests." }],
    files: ["plugin.json", "skills/triage-tests.md"],
  },
];

export const MOCK_LOCAL_PLUGINS: LocalPlugin[] = [
  {
    name: "team-conventions",
    version: "0.1.0",
    description: "House style rules loaded into every conversation.",
    path: "~/.agents/plugins/team-conventions",
    skills: [{ name: "conventions", description: "Team coding conventions." }],
    files: ["plugin.json", "skills/conventions.md"],
  },
];

export const PLUGINS_HANDLERS = [
  http.get("*/api/plugins/marketplace", () =>
    HttpResponse.json({ plugins: MOCK_MARKETPLACE_PLUGINS }),
  ),
  http.get("*/api/plugins/installed", () =>
    HttpResponse.json({ plugins: MOCK_INSTALLED_PLUGINS }),
  ),
  http.post("*/api/plugins", () =>
    HttpResponse.json({ plugins: MOCK_LOCAL_PLUGINS }),
  ),
];
