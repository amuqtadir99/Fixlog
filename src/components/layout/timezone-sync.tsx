"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Stores the browser's IANA timezone in a cookie so the server knows "today". */
export function TimezoneSync() {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie.match(/(?:^|; )tz=([^;]*)/)?.[1];
    if (current && decodeURIComponent(current) === tz) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax; secure`;
    router.refresh();
  }, [router]);
  return null;
}
