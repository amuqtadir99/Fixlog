"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const TABLES = ["assets", "maintenance_tasks", "service_logs", "task_comments"] as const;

/**
 * Subscribes to the user's row changes (RLS-filtered by Supabase Realtime) and
 * refreshes server components, so every open tab/device stays live.
 */
export function RealtimeRefresh() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = getBrowserSupabase(() => getToken());
    if (!supabase) return;

    const channel = supabase.channel(`fixlog:${userId}`);
    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 400);
      });
    }
    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, getToken, router]);

  return (
    <span
      className="text-muted inline-flex items-center gap-1.5 text-xs"
      title={live ? "Live updates on" : "Live updates offline"}
    >
      <span className={live ? "bg-good size-2 rounded-full" : "bg-line-strong size-2 rounded-full"} aria-hidden />
      {live ? "Live" : "Offline"}
    </span>
  );
}
