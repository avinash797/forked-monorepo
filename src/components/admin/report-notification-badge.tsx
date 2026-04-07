"use client";

import { useEffect, useState } from "react";

type ReportNotificationBadgeProps = {
  initialCount: number;
};

export function ReportNotificationBadge({
  initialCount,
}: ReportNotificationBadgeProps) {
  const [count, setCount] = useState(initialCount);

  // Sync when server re-renders with a new initialCount (e.g. after router.refresh())
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/pending-reports", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as { count?: number };
        if (!cancelled && typeof body.count === "number") {
          setCount(body.count);
        }
      } catch {
        // Ignore transient network errors — next tick will retry.
      }
    }

    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-pill text-[11px] font-bold bg-danger text-white animate-pulse">
      {count > 99 ? "99+" : count}
    </span>
  );
}
