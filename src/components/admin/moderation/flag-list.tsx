"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContentFlag } from "@/lib/admin/moderation-queries";

type FlagListProps = {
  flags: ContentFlag[];
};

export function FlagList({ flags }: FlagListProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(flagId: string, status: "reviewed" | "dismissed") {
    setProcessing(flagId);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("content_flags")
      .update({
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", flagId);

    setProcessing(null);
    router.refresh();
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-12 text-[#9BA1A6]">
        <p>No flags to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <div
          key={flag.id}
          className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-4 flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#ECEDEE]">
                {flag.flag_type}
              </span>
              <span className="text-xs text-[#9BA1A6]">
                {flag.target_type}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                  flag.status === "pending"
                    ? "bg-[#FBBF24]/15 text-[#FBBF24]"
                    : flag.status === "reviewed"
                    ? "bg-[#34D399]/15 text-[#34D399]"
                    : "bg-[#9BA1A6]/15 text-[#9BA1A6]"
                }`}
              >
                {flag.status}
              </span>
            </div>
            {flag.reason && (
              <p className="text-sm text-[#c9a492] mb-1">{flag.reason}</p>
            )}
            <p className="text-xs text-[#9BA1A6]">
              {new Date(flag.created_at).toLocaleString()}
            </p>
          </div>

          {flag.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAction(flag.id, "reviewed")}
                disabled={processing === flag.id}
                className="px-3 py-1.5 text-xs font-medium rounded-sm bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25 disabled:opacity-45 transition-colors cursor-pointer"
              >
                Resolve
              </button>
              <button
                type="button"
                onClick={() => handleAction(flag.id, "dismissed")}
                disabled={processing === flag.id}
                className="px-3 py-1.5 text-xs font-medium rounded-sm bg-[#9BA1A6]/15 text-[#9BA1A6] hover:bg-[#9BA1A6]/25 disabled:opacity-45 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
