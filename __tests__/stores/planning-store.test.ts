import { beforeEach, describe, expect, it } from "vitest";
import { usePlanningStore } from "#/stores/planning-store";

describe("planning store", () => {
  beforeEach(() => {
    usePlanningStore.setState({ tickets: [], sprints: [] });
  });

  it("ships with sample data on first load", () => {
    expect(usePlanningStore.getInitialState().tickets.length).toBeGreaterThan(
      0,
    );
  });

  it("assigns unique ids after deletions", () => {
    const { createTicket, deleteTicket } = usePlanningStore.getState();
    const first = createTicket({ title: "A" });
    const second = createTicket({ title: "B" });
    deleteTicket(first.id);

    const third = usePlanningStore.getState().createTicket({ title: "C" });

    expect(third.id).not.toBe(second.id);
  });

  it("starts a new sprint the day after the last one ends", () => {
    usePlanningStore.getState().createSprint({
      name: "One",
      startDate: "2030-01-01",
      endDate: "2030-01-14",
    });

    const next = usePlanningStore.getState().createSprint({ name: "Two" });

    expect(next.startDate).toBe("2030-01-15");
  });

  it("keeps working when localStorage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    try {
      expect(() =>
        usePlanningStore.getState().createTicket({ title: "Offline" }),
      ).not.toThrow();
      expect(usePlanningStore.getState().tickets).toHaveLength(1);
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
