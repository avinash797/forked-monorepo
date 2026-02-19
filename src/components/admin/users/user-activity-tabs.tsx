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
    <div className="bg-surface border border-border rounded-sm">
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "text-accent border-b-2 border-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}{" "}
            <span className="text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "ratings" && <RatingsTab ratings={ratings} />}
        {activeTab === "moderation" && <ModerationTab actions={modHistory} />}
      </div>
    </div>
  );
}

function RatingsTab({ ratings }: { ratings: UserRating[] }) {
  if (ratings.length === 0) {
    return <p className="text-sm text-text-secondary">No ratings yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {ratings.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
        >
          <div>
            <span className="text-text-primary font-medium">
              {r.restaurant_name}
            </span>
            <span className="text-text-secondary mx-1.5">&middot;</span>
            <span className="text-text-secondary">{r.dish_type_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">
              {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
            </span>
            <span
              className={`font-semibold ${
                r.raw_score >= 7
                  ? "text-success"
                  : r.raw_score >= 4
                    ? "text-warning"
                    : "text-danger"
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
    return (
      <p className="text-sm text-text-secondary">No moderation history.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {actions.map((a) => {
        const details = a.details as Record<string, unknown> | null;
        const reasonText = details?.reason ? String(details.reason) : null;
        return (
          <li
            key={a.id}
            className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
          >
            <div>
              <span
                className={`font-medium ${
                  a.action_type === "ban"
                    ? "text-danger"
                    : a.action_type === "unban"
                      ? "text-success"
                      : a.action_type === "warn"
                        ? "text-warning"
                        : "text-text-primary"
                }`}
              >
                {a.action_type.replace("_", " ")}
              </span>
              {reasonText && (
                <span className="text-text-secondary ml-2 text-xs">
                  &mdash; {reasonText}
                </span>
              )}
            </div>
            <span className="text-xs text-text-secondary">
              {new Date(a.created_at).toLocaleDateString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
