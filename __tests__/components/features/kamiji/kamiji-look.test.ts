import { describe, expect, it } from "vitest";
import { ExecutionStatus } from "#/types/agent-server/core";
import { KAMIJI_PROP_NAMES } from "#/components/features/kamiji/kamiji-catalog";
import { getPropUrl } from "#/components/features/kamiji/kamiji-asset-urls";
import {
  KAMIJI_LOOK_KEYS,
  getKamijiLook,
  notificationLookKey,
  statusLookKey,
  updateLookKey,
  withReducedMotion,
} from "#/components/features/kamiji/kamiji-look";

describe("kamiji looks", () => {
  it("gives every execution status its own look and reads unknown ones as idle", () => {
    const keys = Object.values(ExecutionStatus).map((s) => statusLookKey(s));

    expect(new Set(keys).size).toBe(Object.values(ExecutionStatus).length);
    expect(statusLookKey(undefined)).toBe("status:idle");
    expect(statusLookKey("something_new")).toBe("status:idle");
  });

  it("maps the lifecycle moods: typing, question, celebrate, panic, sad", () => {
    expect(getKamijiLook("status:running")).toMatchObject({
      animation: "Typing",
    });
    expect(getKamijiLook("status:waiting_for_confirmation")).toMatchObject({
      expression: "thinking",
      prop: "question",
    });
    expect(getKamijiLook("status:finished")).toMatchObject({
      animation: "Celebrate",
    });
    expect(getKamijiLook("status:error")).toMatchObject({
      expression: "surprised",
      animation: "Bounce",
    });
    expect(getKamijiLook("status:stuck").expression).toBe("sad");
  });

  it("shows a notification with the same face as the status it announces", () => {
    expect(getKamijiLook(notificationLookKey("needs_input"))).toBe(
      getKamijiLook("status:waiting_for_confirmation"),
    );
    expect(getKamijiLook(notificationLookKey("working"))).toBe(
      getKamijiLook("status:running"),
    );
    expect(getKamijiLook(notificationLookKey("error"))).toBe(
      getKamijiLook("status:error"),
    );
  });

  it("uses the git props for pull-request, merge and CI events", () => {
    expect(getKamijiLook("git:pr_merged").prop).toBe("git_pull_request_merged");
    expect(getKamijiLook("git:ci_running").prop).toBe("git_ci_running");
    expect(getKamijiLook("git:ci_failed").prop).toBe("git_ci_fail");
    expect(getKamijiLook("ref:pull_request").prop).toBe("git_pull_request");
  });

  it("leaves the user's own messages without a Kamiji", () => {
    expect(updateLookKey("user")).toBeNull();
    expect(updateLookKey("agent")).toBe("update:agent");
    expect(updateLookKey("action")).toBe("update:action");
  });

  it("only references props that are catalogued and bundled, each with a 2D stand-in", () => {
    KAMIJI_LOOK_KEYS.forEach((key) => {
      const { prop, emoji } = getKamijiLook(key);
      if (prop) {
        expect(KAMIJI_PROP_NAMES).toContain(prop);
        expect(getPropUrl(prop)).not.toBe("");
        expect(emoji).toBeTruthy();
      }
    });
  });

  it("keeps the face but drops the clip under reduced motion", () => {
    const look = getKamijiLook("status:finished");

    expect(withReducedMotion(look, true)).toEqual({
      ...look,
      animation: "Idle",
    });
    expect(withReducedMotion(look, false)).toBe(look);
  });
});
