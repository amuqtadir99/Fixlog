"use server";

import { revalidatePath } from "next/cache";
import { getItemType } from "@/lib/catalog";
import { addInterval } from "@/lib/domain";
import type { ActionState } from "@/lib/validation";
import { getToday } from "@/server/today";
import { dbError, mutationContext, RateLimitError } from "./guard";
import { subDays, format, parseISO } from "date-fns";

const SAMPLES = [
  { name: "2019 Honda Civic", category: "vehicle", item_type: "car", location: "Garage", brand: "Honda" },
  { name: "Kitchen fridge", category: "appliances", item_type: "refrigerator", location: "Kitchen" },
  { name: "Hallway smoke alarm", category: "safety", item_type: "smoke_detector", location: "Hallway" },
  { name: "Central AC", category: "home_systems", item_type: "hvac", location: "Utility room" },
] as const;

/**
 * Fills an empty account with a few realistic items so a new user can see the
 * dashboard working. Refuses if the account already has items.
 */
export async function loadSampleData(_prev: ActionState | null): Promise<ActionState> {
  try {
    const { supabase, userId } = await mutationContext();
    const today = await getToday();
    const ago = (days: number) => format(subDays(parseISO(today), days), "yyyy-MM-dd");

    const { count, error: countError } = await supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (countError) return dbError("load sample data", countError);
    if ((count ?? 0) > 0) return { ok: false, message: "Sample data can only be added to an empty account." };

    const { data: assets, error } = await supabase
      .from("assets")
      .insert(SAMPLES.map((s) => ({ ...s, user_id: userId })))
      .select("id, category, item_type");
    if (error) return dbError("load sample data", error);

    // Stagger "last done" dates so the dashboard shows a mix of overdue, due-soon and later work.
    const lastDone = [200, 360, 20, 95, 400, 30, 185, 10, 340, 60, 5, 370];
    let n = 0;
    const tasks = assets.flatMap((a) =>
      (getItemType(a.category, a.item_type)?.tasks ?? []).map((t) => {
        const done = ago(lastDone[n++ % lastDone.length]);
        return {
          user_id: userId,
          asset_id: a.id,
          title: t.title,
          interval_value: t.every,
          interval_unit: t.unit,
          priority: t.priority,
          last_completed_on: done,
          next_due_on: addInterval(done, t.every, t.unit),
        };
      }),
    );
    const { error: taskError } = await supabase.from("maintenance_tasks").insert(tasks);
    if (taskError) return dbError("load sample data", taskError);

    const car = assets.find((a) => a.item_type === "car")!;
    const hvac = assets.find((a) => a.item_type === "hvac")!;
    const { error: logError } = await supabase.from("service_logs").insert([
      {
        user_id: userId,
        asset_id: car.id,
        title: "Oil & filter change",
        performed_on: ago(200),
        performed_by: "Quick Lube",
        cost_cents: 6499,
        reading: "48,200 km",
      },
      {
        user_id: userId,
        asset_id: car.id,
        title: "New wiper blades",
        performed_on: ago(45),
        performed_by: "Me",
        cost_cents: 2899,
      },
      {
        user_id: userId,
        asset_id: hvac.id,
        title: "Replaced air filter",
        performed_on: ago(95),
        performed_by: "Me",
        cost_cents: 1850,
      },
    ]);
    if (logError) return dbError("load sample data", logError);
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Sample data added." };
}
