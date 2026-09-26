"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  commentSchema,
  completeTaskSchema,
  formDataToObject,
  idSchema,
  statusSchema,
  taskSchema,
  updateTaskSchema,
  validationError,
  type ActionState,
} from "@/lib/validation";
import { dbError, mutationContext, RateLimitError } from "./guard";

async function run(fn: () => Promise<ActionState | void>, success: string): Promise<ActionState> {
  try {
    const result = await fn();
    if (result) return result;
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: success };
}

export async function createTask(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = taskSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  return run(async () => {
    const { supabase, userId } = await mutationContext();
    const { error } = await supabase.from("maintenance_tasks").insert({ ...parsed.data, user_id: userId });
    if (error) return dbError("create the task", error);
  }, "Task added.");
}

export async function updateTask(id: string, _prev: ActionState | null, formData: FormData): Promise<ActionState> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Invalid task" };
  const parsed = updateTaskSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  return run(async () => {
    const { supabase, userId } = await mutationContext();
    const { error } = await supabase.from("maintenance_tasks").update(parsed.data).eq("id", id).eq("user_id", userId);
    if (error) return dbError("update the task", error);
  }, "Task saved.");
}

export async function setTaskStatus(formData: FormData): Promise<ActionState> {
  const parsed = statusSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid status" };
  return run(async () => {
    const { supabase, userId } = await mutationContext();
    const { error } = await supabase
      .from("maintenance_tasks")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .eq("user_id", userId);
    if (error) return dbError("change the status", error);
  }, "Status updated.");
}

export async function completeTask(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = completeTaskSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;
  return run(async () => {
    const { supabase, userId } = await mutationContext();
    // Ownership check first: in demo mode the client bypasses RLS.
    const { data: owned, error: ownError } = await supabase
      .from("maintenance_tasks")
      .select("id")
      .eq("id", d.task_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (ownError) return dbError("mark the task done", ownError);
    if (!owned) return { ok: false, message: "Task not found." };
    const { error } = await supabase.rpc("complete_task", {
      p_task_id: d.task_id,
      p_performed_on: d.performed_on,
      p_performed_by: d.performed_by,
      p_cost_cents: d.cost,
      p_currency: d.currency,
      p_reading: d.reading,
      p_notes: d.notes,
    });
    if (error) return dbError("mark the task done", error);
  }, "Nice work — logged and rescheduled.");
}

export async function deleteTask(id: string, redirectTo?: string): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  const { supabase, userId } = await mutationContext();
  const { error } = await supabase.from("maintenance_tasks").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(dbError("delete the task", error).message);
  revalidatePath("/", "layout");
  if (redirectTo && /^\/items\/[0-9a-f-]{36}$/.test(redirectTo)) redirect(redirectTo);
  redirect("/tasks");
}

export async function addComment(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = commentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  return run(async () => {
    const { supabase, userId } = await mutationContext();
    const { error } = await supabase.from("task_comments").insert({ ...parsed.data, user_id: userId });
    if (error) return dbError("post the comment", error);
  }, "Comment added.");
}

export async function deleteComment(id: string): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  const { supabase, userId } = await mutationContext();
  const { error } = await supabase.from("task_comments").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(dbError("delete the comment", error).message);
  revalidatePath("/", "layout");
}
