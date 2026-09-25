import "server-only";
import { cookies } from "next/headers";
import { todayInTimeZone } from "@/lib/domain";

export const TZ_COOKIE = "tz";

/** The user's local "today" (YYYY-MM-DD), from the tz cookie set by the client. */
export async function getToday(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return todayInTimeZone(tz && /^[A-Za-z0-9_+\-/]{1,64}$/.test(tz) ? tz : undefined);
}
