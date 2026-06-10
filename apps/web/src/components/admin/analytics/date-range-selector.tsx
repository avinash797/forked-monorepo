"use client";

import { useRouter, useSearchParams } from "next/navigation";

const presets = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function DateRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = parseInt(searchParams.get("days") ?? "30", 10);

  function handleSelect(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <div className="flex gap-1">
      {presets.map((p) => (
        <button
          key={p.days}
          type="button"
          onClick={() => handleSelect(p.days)}
          className={`px-3 py-1.5 text-sm rounded-sm transition-colors cursor-pointer ${
            currentDays === p.days
              ? "bg-accent text-white"
              : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
