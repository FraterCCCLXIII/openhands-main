import { describe, expect, it } from "vitest";
import {
  fileChangeOf,
  gitActionsOf,
  lineDiff,
  mergeChanges,
} from "#/utils/code-activity";

describe("lineDiff", () => {
  it("keeps unchanged lines as context and marks the rest added or removed", () => {
    const diff = lineDiff("a\nb\nc", "a\nB\nc\nd");

    expect(diff.map((l) => `${l.type}:${l.text}`)).toEqual([
      "ctx:a",
      "del:b",
      "add:B",
      "ctx:c",
      "add:d",
    ]);
  });
});

describe("fileChangeOf", () => {
  it("counts the lines a replace and a create change, and ignores a view", () => {
    const edit = fileChangeOf({
      command: "str_replace",
      path: "/x.ts",
      old_str: "one\ntwo",
      new_str: "one\n2\nthree",
    });
    expect(edit).toMatchObject({ kind: "edit", added: 2, removed: 1 });

    expect(
      fileChangeOf({ command: "create", path: "/n.ts", file_text: "a\nb" }),
    ).toMatchObject({ kind: "create", added: 2, removed: 0 });

    expect(fileChangeOf({ command: "view", path: "/x.ts" })).toBeNull();
  });

  it("folds several edits to one file into one entry", () => {
    const one = fileChangeOf({ command: "insert", path: "/f", new_str: "a" })!;
    const two = fileChangeOf({
      command: "insert",
      path: "/f",
      new_str: "b\nc",
    })!;

    const [merged] = mergeChanges([one, two]);

    expect(merged).toMatchObject({ path: "/f", added: 3 });
  });
});

describe("gitActionsOf", () => {
  it("finds each git and GitHub command in a chained line and what it touched", () => {
    const actions = gitActionsOf(
      'cd /repo && git add -A && git commit -m "Fix the parser" && git push -u origin fix/parser && gh pr create --title "Fix parser" --body x',
      "[fix/parser 1a2b3c4] Fix the parser\nhttps://github.com/acme/app/pull/42",
    );

    expect(actions.map((a) => a.command)).toEqual([
      "git add",
      "git commit",
      "git push",
      "gh pr create",
    ]);
    expect(actions[1]).toMatchObject({
      detail: "Fix the parser",
      sha: "1a2b3c4",
    });
    expect(actions[2].detail).toBe("origin fix/parser");
    expect(actions[3].url).toBe("https://github.com/acme/app/pull/42");
  });

  it("flags a force push and a hard reset, and skips other commands", () => {
    const actions = gitActionsOf(
      "git push --force origin main; git reset --hard HEAD~1; ls -la",
    );
    expect(actions.map((a) => [a.command, a.warn])).toEqual([
      ["git push --force", true],
      ["git reset --hard", true],
    ]);
  });
});
