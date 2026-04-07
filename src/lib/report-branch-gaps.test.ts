// @ts-ignore -- this test imports the local ESM CLI script directly.
import * as branchGapReport from "../../scripts/report-branch-gaps.mjs";
import { describe, expect, it } from "vitest";

const {
  classifyCoverageArea,
  isRelevantCoverageFile,
  renderBranchCoverageSummary,
  summarizeBranchCoverage,
} = branchGapReport;

describe("branch coverage reporting", () => {
  const rootDir = "/workspace/project/context-layer";
  const coverageSummary = {
    total: {
      branches: { total: 100, covered: 80, skipped: 0, pct: 80 },
    },
    "/workspace/project/context-layer/app/page.tsx": {
      branches: { total: 4, covered: 3, skipped: 0, pct: 75 },
    },
    "/workspace/project/context-layer/app/api/context/route.ts": {
      branches: { total: 12, covered: 7, skipped: 0, pct: 58.33 },
    },
    "/workspace/project/context-layer/src/components/dashboard/workspace.tsx": {
      branches: { total: 20, covered: 12, skipped: 0, pct: 60 },
    },
    "/workspace/project/context-layer/src/lib/core/service.ts": {
      branches: { total: 30, covered: 15, skipped: 0, pct: 50 },
    },
    "/workspace/project/context-layer/src/lib/db/pglite-test-utils.ts": {
      branches: { total: 20, covered: 20, skipped: 0, pct: 100 },
    },
    "/workspace/project/context-layer/src/lib/core/service.test.ts": {
      branches: { total: 10, covered: 0, skipped: 0, pct: 0 },
    },
  };

  it("classifies the configured frontend and backend areas", () => {
    expect(classifyCoverageArea("app/page.tsx")).toBe("frontend-app");
    expect(classifyCoverageArea("src/components/dashboard/workspace.tsx")).toBe(
      "frontend-components",
    );
    expect(classifyCoverageArea("app/api/context/route.ts")).toBe("backend-api");
    expect(classifyCoverageArea("src/lib/core/service.ts")).toBe("backend-lib");
    expect(classifyCoverageArea("proxy.ts")).toBeNull();
  });

  it("filters out test-only and helper files from the report", () => {
    expect(isRelevantCoverageFile("src/lib/core/service.ts")).toBe(true);
    expect(isRelevantCoverageFile("src/lib/core/service.test.ts")).toBe(false);
    expect(isRelevantCoverageFile("src/lib/db/pglite-test-utils.ts")).toBe(false);
  });

  it("summarizes branch coverage by area and ranks the largest gaps", () => {
    const summary = summarizeBranchCoverage(coverageSummary, rootDir);

    expect(summary.groups).toEqual([
      expect.objectContaining({
        name: "frontend",
        coveredBranches: 15,
        totalBranches: 24,
        uncoveredBranches: 9,
        branchPct: 62.5,
      }),
      expect.objectContaining({
        name: "frontend-app",
        coveredBranches: 3,
        totalBranches: 4,
        uncoveredBranches: 1,
        branchPct: 75,
      }),
      expect.objectContaining({
        name: "frontend-components",
        coveredBranches: 12,
        totalBranches: 20,
        uncoveredBranches: 8,
        branchPct: 60,
      }),
      expect.objectContaining({
        name: "backend",
        coveredBranches: 22,
        totalBranches: 42,
        uncoveredBranches: 20,
        branchPct: 52.38,
      }),
      expect.objectContaining({
        name: "backend-api",
        coveredBranches: 7,
        totalBranches: 12,
        uncoveredBranches: 5,
        branchPct: 58.33,
      }),
      expect.objectContaining({
        name: "backend-lib",
        coveredBranches: 15,
        totalBranches: 30,
        uncoveredBranches: 15,
        branchPct: 50,
      }),
    ]);

    expect(summary.files.slice(0, 3)).toEqual([
      expect.objectContaining({
        relativePath: "src/lib/core/service.ts",
        uncoveredBranches: 15,
      }),
      expect.objectContaining({
        relativePath: "src/components/dashboard/workspace.tsx",
        uncoveredBranches: 8,
      }),
      expect.objectContaining({
        relativePath: "app/api/context/route.ts",
        uncoveredBranches: 5,
      }),
    ]);
  });

  it("renders a markdown summary for CI step output", () => {
    const summary = summarizeBranchCoverage(coverageSummary, rootDir);
    const markdown = renderBranchCoverageSummary(summary, {
      format: "markdown",
      topFiles: 2,
    });

    expect(markdown).toContain("### Branch coverage by area");
    expect(markdown).toContain("| Frontend total | 62.50% | 15/24 | 9 | 2 |");
    expect(markdown).toContain("`src/lib/core/service.ts`");
    expect(markdown).toContain("`src/components/dashboard/workspace.tsx`");
    expect(markdown).not.toContain("pglite-test-utils");
  });
});
