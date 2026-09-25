"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  assetSchema,
  createAssetSchema,
  formDataToObject,
  idSchema,
  validationError,
  type ActionState,
} from "@/lib/validation";
import { dbError, mutationContext, RateLimitError } from "./guard";

function parseTasksJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 20_000) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function createAsset(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const fields = formDataToObject(formData);
  const parsed = createAssetSchema.safeParse({
    asset: fields,
    tasks: parseTasksJson(formData.get("tasks")),
  });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const nested = parsed.error.issues.filter((i) => i.path[0] === "asset");
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of nested) {
      const key = String(issue.path[1] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      ok: false,
      message: nested.length ? "Please fix the highlighted fields." : "Some suggested tasks were invalid.",
      fieldErrors: { ...flat.fieldErrors, ...fieldErrors },
    };
  }

  let assetId: string;
  try {
    const { supabase } = await mutationContext();
    const { data, error } = await supabase.from("assets").insert(parsed.data.asset).select("id").single();
    if (error) return dbError("save the item", error);
    assetId = data.id;

    if (parsed.data.tasks.length) {
      const rows = parsed.data.tasks.map((t) => ({ ...t, asset_id: assetId }));
      const { error: taskError } = await supabase.from("maintenance_tasks").insert(rows);
      if (taskError) return dbError("create the suggested tasks", taskError);
    }
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }

  revalidatePath("/", "layout");
  redirect(`/items/${assetId}`);
}

export async function updateAsset(id: string, _prev: ActionState | null, formData: FormData): Promise<ActionState> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Invalid item" };
  const parsed = assetSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const { supabase } = await mutationContext();
    const { error } = await supabase.from("assets").update(parsed.data).eq("id", id);
    if (error) return dbError("update the item", error);
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Item saved." };
}

export async function setAssetArchived(id: string, archived: boolean): Promise<void> {
  if (!idSchema.safeParse(id).success || typeof archived !== "boolean") return;
  const { supabase } = await mutationContext();
  const { error } = await supabase.from("assets").update({ archived }).eq("id", id);
  if (error) throw new Error(dbError("archive the item", error).message);
  revalidatePath("/", "layout");
}

export async function deleteAsset(id: string): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  const { supabase } = await mutationContext();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw new Error(dbError("delete the item", error).message);
  revalidatePath("/", "layout");
  redirect("/items");
}
