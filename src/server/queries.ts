import "server-only";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import type { Asset, Comment, ServiceLogWithAsset, TaskWithAsset, Task, ServiceLog } from "@/lib/types";
import { idSchema } from "@/lib/validation";

const ASSET_REF = "asset:assets!inner(id,name,category,item_type,archived)";
const MAX_ROWS = 2000;

// Every query filters by user_id explicitly as well as relying on RLS: in demo
// mode the client is service-role (RLS bypassed), and it's cheap defence in depth.

function fail(context: string, error: { message: string; code?: string }): never {
  console.error(`[db] ${context}:`, error.code, error.message);
  // Missing tables = migrations not applied. Say so in the logs explicitly.
  if (error.code === "PGRST205" || error.code === "42P01") {
    console.error("[db] FixLog tables not found — apply supabase/migrations (see docs/DEPLOYMENT.md).");
  }
  throw new Error(`Could not load ${context}`);
}

export async function listAssets(opts: { archived?: boolean } = {}): Promise<Asset[]> {
  const { supabase, userId } = await getSupabase();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", opts.archived ?? false)
    .order("name")
    .limit(MAX_ROWS);
  if (error) fail("items", error);
  return data as Asset[];
}

/** All tasks on non-archived items. */
export async function listTasks(): Promise<TaskWithAsset[]> {
  const { supabase, userId } = await getSupabase();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .select(`*, ${ASSET_REF}`)
    .eq("user_id", userId)
    .eq("asset.archived", false)
    .order("next_due_on", { ascending: true, nullsFirst: false })
    .limit(MAX_ROWS);
  if (error) fail("tasks", error);
  return data as unknown as TaskWithAsset[];
}

export async function listServiceLogs(opts: { limit?: number; since?: string } = {}): Promise<ServiceLogWithAsset[]> {
  const { supabase, userId } = await getSupabase();
  let q = supabase
    .from("service_logs")
    .select(`*, ${ASSET_REF}`)
    .eq("user_id", userId)
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 500, MAX_ROWS));
  if (opts.since) q = q.gte("performed_on", opts.since);
  const { data, error } = await q;
  if (error) fail("history", error);
  return data as unknown as ServiceLogWithAsset[];
}

export async function getAssetDetail(id: string) {
  if (!idSchema.safeParse(id).success) notFound();
  const { supabase, userId } = await getSupabase();
  const [asset, tasks, logs] = await Promise.all([
    supabase.from("assets").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("asset_id", id)
      .eq("user_id", userId)
      .order("next_due_on")
      .limit(MAX_ROWS),
    supabase
      .from("service_logs")
      .select("*")
      .eq("asset_id", id)
      .eq("user_id", userId)
      .order("performed_on", { ascending: false })
      .limit(MAX_ROWS),
  ]);
  if (asset.error) fail("item", asset.error);
  if (!asset.data) notFound();
  if (tasks.error) fail("item tasks", tasks.error);
  if (logs.error) fail("item history", logs.error);
  return { asset: asset.data as Asset, tasks: tasks.data as Task[], logs: logs.data as ServiceLog[] };
}

export async function getTaskDetail(id: string) {
  if (!idSchema.safeParse(id).success) notFound();
  const { supabase, userId } = await getSupabase();
  const [task, comments, logs] = await Promise.all([
    supabase.from("maintenance_tasks").select(`*, ${ASSET_REF}`).eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("task_comments").select("*").eq("task_id", id).eq("user_id", userId).order("created_at").limit(500),
    supabase
      .from("service_logs")
      .select("*")
      .eq("task_id", id)
      .eq("user_id", userId)
      .order("performed_on", { ascending: false })
      .limit(500),
  ]);
  if (task.error) fail("task", task.error);
  if (!task.data) notFound();
  if (comments.error) fail("comments", comments.error);
  if (logs.error) fail("task history", logs.error);
  return {
    task: task.data as unknown as TaskWithAsset,
    comments: comments.data as Comment[],
    logs: logs.data as ServiceLog[],
  };
}
