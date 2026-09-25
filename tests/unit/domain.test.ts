import { describe, expect, it } from "vitest";
import {
  addInterval,
  compareTasks,
  describeInterval,
  getUrgency,
  healthScore,
  relativeDue,
  todayInTimeZone,
} from "@/lib/domain";

const today = "2026-09-25";

describe("getUrgency", () => {
  it.each([
    ["2026-09-24", "overdue"],
    ["2026-09-25", "due_soon"],
    ["2026-10-02", "due_soon"],
    ["2026-10-03", "upcoming"],
    ["2026-10-25", "upcoming"],
    ["2026-10-26", "later"],
  ] as const)("%s → %s", (due, expected) => {
    expect(getUrgency({ next_due_on: due, status: "pending" }, today)).toBe(expected);
  });

  it("handles no date and done", () => {
    expect(getUrgency({ next_due_on: null, status: "pending" }, today)).toBe("unscheduled");
    expect(getUrgency({ next_due_on: "2020-01-01", status: "done" }, today)).toBe("done");
  });
});

describe("addInterval", () => {
  it("adds calendar units, clamping month ends", () => {
    expect(addInterval("2026-01-31", 1, "month")).toBe("2026-02-28");
    expect(addInterval("2026-02-10", 6, "month")).toBe("2026-08-10");
    expect(addInterval("2026-12-30", 1, "week")).toBe("2027-01-06");
    expect(addInterval("2024-02-29", 1, "year")).toBe("2025-02-28");
    expect(addInterval("2026-09-25", 10, "day")).toBe("2026-10-05");
  });
});

describe("healthScore", () => {
  it("is 100 with nothing open", () => {
    expect(healthScore([], today)).toBe(100);
    expect(healthScore([{ next_due_on: "2020-01-01", status: "done", priority: "high" }], today)).toBe(100);
  });

  it("drops with overdue work, more for critical", () => {
    const low = healthScore(
      [
        { next_due_on: "2026-09-20", status: "pending", priority: "low" },
        { next_due_on: "2027-01-01", status: "pending", priority: "critical" },
      ],
      today,
    );
    const crit = healthScore(
      [
        { next_due_on: "2026-09-20", status: "pending", priority: "critical" },
        { next_due_on: "2027-01-01", status: "pending", priority: "low" },
      ],
      today,
    );
    expect(crit).toBeLessThan(low);
    expect(crit).toBeGreaterThanOrEqual(0);
  });

  it("is 0 when everything is very late", () => {
    expect(healthScore([{ next_due_on: "2025-01-01", status: "pending", priority: "medium" }], today)).toBe(0);
  });
});

describe("formatting helpers", () => {
  it("describes intervals", () => {
    expect(describeInterval(null, null)).toBe("One-off");
    expect(describeInterval(1, "month")).toBe("Every month");
    expect(describeInterval(6, "month")).toBe("Every 6 months");
  });

  it("describes relative due dates", () => {
    expect(relativeDue("2026-09-25", today)).toBe("Due today");
    expect(relativeDue("2026-09-26", today)).toBe("Due tomorrow");
    expect(relativeDue("2026-09-20", today)).toBe("5 days overdue");
    expect(relativeDue(null, today)).toBe("No due date");
  });

  it("resolves today per timezone and survives bad input", () => {
    const now = new Date("2026-09-25T23:30:00Z");
    expect(todayInTimeZone("UTC", now)).toBe("2026-09-25");
    expect(todayInTimeZone("Asia/Tokyo", now)).toBe("2026-09-26");
    expect(todayInTimeZone("America/Los_Angeles", now)).toBe("2026-09-25");
    expect(todayInTimeZone("Not/AZone", now)).toBe("2026-09-25");
  });
});

describe("compareTasks", () => {
  it("orders overdue first, then by date, then priority", () => {
    const tasks = [
      { id: "later", next_due_on: "2027-01-01", status: "pending", priority: "critical" },
      { id: "overdue", next_due_on: "2026-09-01", status: "pending", priority: "low" },
      { id: "soonHigh", next_due_on: "2026-09-27", status: "pending", priority: "high" },
      { id: "soonLow", next_due_on: "2026-09-26", status: "pending", priority: "low" },
    ];
    expect(tasks.sort(compareTasks(today)).map((t) => t.id)).toEqual(["overdue", "soonLow", "soonHigh", "later"]);
  });
});
