import { describe, expect, it } from "vitest";
import { assetSchema, completeTaskSchema, createAssetSchema, taskSchema } from "@/lib/validation";

const uuid = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

describe("assetSchema", () => {
  it("accepts a valid item and normalises empties to null", () => {
    const r = assetSchema.parse({
      name: "  Civic ",
      category: "vehicle",
      item_type: "car",
      brand: "",
      purchased_on: "",
    });
    expect(r).toMatchObject({ name: "Civic", brand: null, purchased_on: null });
  });

  it("rejects type not in category and unknown category", () => {
    expect(assetSchema.safeParse({ name: "x", category: "vehicle", item_type: "refrigerator" }).success).toBe(false);
    expect(assetSchema.safeParse({ name: "x", category: "spaceship", item_type: "car" }).success).toBe(false);
  });

  it("strips unknown keys (no mass assignment of user_id)", () => {
    const r = assetSchema.parse({ name: "x", category: "vehicle", item_type: "car", user_id: "attacker", id: uuid });
    expect(r).not.toHaveProperty("user_id");
    expect(r).not.toHaveProperty("id");
  });

  it("caps lengths", () => {
    expect(assetSchema.safeParse({ name: "x".repeat(121), category: "vehicle", item_type: "car" }).success).toBe(false);
  });
});

describe("taskSchema", () => {
  it("requires interval value and unit together", () => {
    expect(
      taskSchema.safeParse({ asset_id: uuid, title: "t", interval_value: "6", interval_unit: "none" }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({ asset_id: uuid, title: "t", interval_value: "", interval_unit: "none" }).success,
    ).toBe(true);
    const r = taskSchema.parse({ asset_id: uuid, title: "t", interval_value: "6", interval_unit: "month" });
    expect(r).toMatchObject({ interval_value: 6, interval_unit: "month", priority: "medium", status: "pending" });
  });

  it("rejects bad ids and statuses", () => {
    expect(taskSchema.safeParse({ asset_id: "1; drop table", title: "t" }).success).toBe(false);
    expect(taskSchema.safeParse({ asset_id: uuid, title: "t", status: "hacked" }).success).toBe(false);
  });
});

describe("completeTaskSchema", () => {
  it("converts cost to integer cents and upper-cases currency", () => {
    const r = completeTaskSchema.parse({ task_id: uuid, performed_on: "2026-09-01", cost: "49.99", currency: "eur" });
    expect(r.cost).toBe(4999);
    expect(r.currency).toBe("EUR");
  });

  it("treats blank cost as unknown, not zero", () => {
    expect(completeTaskSchema.parse({ task_id: uuid, performed_on: "2026-09-01", cost: "" }).cost).toBeNull();
    expect(completeTaskSchema.parse({ task_id: uuid, performed_on: "2026-09-01" }).cost).toBeNull();
    expect(completeTaskSchema.parse({ task_id: uuid, performed_on: "2026-09-01", cost: "0" }).cost).toBe(0);
  });

  it("rejects negative cost and invalid dates", () => {
    expect(completeTaskSchema.safeParse({ task_id: uuid, performed_on: "2026-09-01", cost: "-1" }).success).toBe(false);
    expect(completeTaskSchema.safeParse({ task_id: uuid, performed_on: "2026-13-40" }).success).toBe(false);
  });
});

describe("createAssetSchema", () => {
  it("limits number of suggested tasks", () => {
    const task = { title: "t", interval_value: 1, interval_unit: "month", priority: "low", next_due_on: "2026-09-25" };
    const asset = { name: "x", category: "vehicle", item_type: "car" };
    expect(createAssetSchema.safeParse({ asset, tasks: Array(20).fill(task) }).success).toBe(true);
    expect(createAssetSchema.safeParse({ asset, tasks: Array(21).fill(task) }).success).toBe(false);
  });
});
