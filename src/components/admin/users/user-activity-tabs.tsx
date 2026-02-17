"use client";

import { useState } from "react";
import type { UserRating, AdminAction } from "@/lib/admin/user-queries";

type UserActivityTabsProps = {
  ratings: UserRating[];
  modHistory: AdminAction[];
};

type Tab = "ratings" | "moderation";

export function UserActivityTabs({
  ratings,
  modHistory,
}: UserActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ratings");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "ratings", label: "Ratings", count: ratings.length },
    { key: "moderation", label: "Mod History", count: modHistory.length },
  ];

  return (
    <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm">
      <div className="flex border-b border-[rgba(236,237,238,0.08)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "text-[#ee6c2b] border-b-2 border-[#ee6c2b]"
                : "text-[#9BA1A6] hover:text-[#ECEDEE]"
            }`}
          >
            {tab.label}{" "}
            <span className="text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "ratings" && (
          <RatingsTab ratings={ratings} />
        )}
        {activeTab === "moderation" && (
          <ModerationTab actions={modHistory} />
        )}
      </div>
    </div>
  );
}

function RatingsTab({ ratings }: { ratings: UserRating[] }) {
  if (ratings.length === 0) {
    return <p className="text-sm text-[#9BA1A6]">No ratings yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {ratings.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between text-sm py-2 border-b border-[rgba(236,237,238,0.05)] last:border-0"
        >
          <div>
            <span className="text-[#ECEDEE] font-medium">
              {r.restaurant_name}
            </span>
            <span className="text-[#9BA1A6] mx-1.5">&middot;</span>
            <span className="text-[#c9a492]">{r.dish_type_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9BA1A6]">
              {r.created_at
                ? new Date(r.created_at).toLocaleDateString()
                : "-"}
            </span>
            <span
              className={`font-semibold ${
                r.raw_score >= 7
                  ? "text-[#34D399]"
                  : r.raw_score >= 4
                  ? "text-[#FBBF24]"
                  : "text-[#F87171]"
              }`}
            >
              {r.raw_score}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ModerationTab({ actions }: { actions: AdminAction[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-[#9BA1A6]">No moderation history.</p>;
  }

  return (
    <ul className="space-y-2">
      {actions.map((a) => {
        const details = a.details as Record<string, unknown> | null;
        const reasonText = details?.reason ? String(details.reason) : null;
        return (
          <li
            key={a.id}
            className="flex items-center justify-between text-sm py-2 border-b border-[rgba(236,237,238,0.05)] last:border-0"
          >
            <div>
              <span
                className={`font-medium ${
                  a.action_type === "ban"
                    ? "text-[#F87171]"
                    : a.action_type === "unban"
                    ? "text-[#34D399]"
                    : a.action_type === "warn"
                    ? "text-[#FBBF24]"
                    : "text-[#ECEDEE]"
                }`}
              >
                {a.action_type.replace("_", " ")}
              </span>
              {reasonText && (
                <span className="text-[#9BA1A6] ml-2 text-xs">
                  &mdash; {reasonText}
                </span>
              )}
            </div>
            <span className="text-xs text-[#9BA1A6]">
              {new Date(a.created_at).toLocaleDateString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
