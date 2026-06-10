import Link from "next/link";
import { getFlagCounts, getContentFlags } from "@/lib/admin/moderation-queries";
import { getPendingReportCount } from "@/lib/admin/report-queries";
import { FlagList } from "@/components/admin/moderation/flag-list";
import { MetricCard } from "@/components/admin/metric-card";
import { PendingReportsBanner } from "@/components/admin/pending-reports-banner";

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

  const [counts, { flags }, pendingReportCount] = await Promise.all([
    getFlagCounts(),
    getContentFlags({ status }),
    getPendingReportCount(),
  ]);

  const statuses = ["pending", "reviewed", "dismissed", "all"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Moderation</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/moderation/reports"
            className="px-4 py-2 rounded-sm text-sm font-medium bg-surface-2 text-text-primary hover:bg-surface-2/80 transition-colors"
          >
            Reports
          </Link>
          <Link
            href="/admin/moderation/photos"
            className="px-4 py-2 rounded-sm text-sm font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors"
          >
            Photo Review
          </Link>
          <Link
            href="/admin/moderation/restaurants"
            className="px-4 py-2 rounded-sm text-sm font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors"
          >
            Restaurants
          </Link>
        </div>
      </div>

      <PendingReportsBanner count={pendingReportCount} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pending Reports" value={pendingReportCount} />
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
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
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
