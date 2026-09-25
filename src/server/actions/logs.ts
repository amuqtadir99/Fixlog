"use server";

import { revalidatePath } from "next/cache";
import { formDataToObject, idSchema, serviceLogSchema, validationError, type ActionState } from "@/lib/validation";
import { dbError, mutationContext, RateLimitError } from "./guard";

export async function addServiceLog(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = serviceLogSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { cost, ...rest } = parsed.data;
  try {
    const { supabase } = await mutationContext();
    const { error } = await supabase.from("service_logs").insert({ ...rest, cost_cents: cost });
    if (error) return dbError("save the service record", error);
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Service recorded." };
}

export async function deleteServiceLog(id: string): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  const { supabase } = await mutationContext();
  const { error } = await supabase.from("service_logs").delete().eq("id", id);
  if (error) throw new Error(dbError("delete the record", error).message);
  revalidatePath("/", "layout");
}
