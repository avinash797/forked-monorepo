import Link from "next/link";
import { getFlagCounts, getContentFlags } from "@/lib/admin/moderation-queries";
import { FlagList } from "@/components/admin/moderation/flag-list";
import { MetricCard } from "@/components/admin/metric-card";

type SearchParams = Promise<{
  status?: string;
}>;

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "pending";

  const [counts, { flags }] = await Promise.all([
    getFlagCounts(),
    getContentFlags({ status }),
  ]);

  const statuses = ["pending", "reviewed", "dismissed", "all"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#ECEDEE]">Moderation</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/moderation/photos"
            className="px-4 py-2 rounded-sm text-sm font-medium bg-[#482f23] text-[#ECEDEE] hover:bg-[#3d2a1f] transition-colors"
          >
            Photo Review
          </Link>
          <Link
            href="/admin/moderation/restaurants"
            className="px-4 py-2 rounded-sm text-sm font-medium bg-[#482f23] text-[#ECEDEE] hover:bg-[#3d2a1f] transition-colors"
          >
            Restaurants
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Pending Flags" value={counts.pending} />
        <MetricCard title="Reviewed" value={counts.reviewed} />
        <MetricCard title="Dismissed" value={counts.dismissed} />
      </div>

      <div className="flex gap-1">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/moderation?status=${s}`}
            className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
              status === s
                ? "bg-[#ee6c2b] text-white"
                : "text-[#9BA1A6] hover:bg-[#342219] hover:text-[#ECEDEE]"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <FlagList flags={flags} />
    </div>
  );
}
