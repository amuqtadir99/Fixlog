import { describe, expect, it } from "vitest";
import { CATEGORIES, getItemType } from "@/lib/catalog";

describe("catalog", () => {
  it("has unique, DB-safe ids", () => {
    const re = /^[a-z_]{2,40}$/;
    const cats = new Set<string>();
    for (const c of CATEGORIES) {
      expect(c.id).toMatch(re);
      expect(cats.has(c.id)).toBe(false);
      cats.add(c.id);
      const types = new Set<string>();
      for (const t of c.types) {
        expect(t.id).toMatch(re);
        expect(types.has(t.id)).toBe(false);
        types.add(t.id);
        for (const task of t.tasks) {
          expect(task.title.length).toBeLessThanOrEqual(160);
          expect(task.every).toBeGreaterThan(0);
        }
      }
    }
  });

  it("offers plenty of options", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
    expect(CATEGORIES.flatMap((c) => c.types).length).toBeGreaterThanOrEqual(65);
  });

  it("looks up types", () => {
    expect(getItemType("vehicle", "car")?.label).toBe("Car / SUV");
    expect(getItemType("vehicle", "nope")).toBeUndefined();
  });
});
