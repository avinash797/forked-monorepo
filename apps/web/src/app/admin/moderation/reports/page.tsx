import Link from "next/link";
import {
  getReportCounts,
  getContentReports,
  type ReportStatus,
  type ReportReason,
} from "@/lib/admin/report-queries";
import { MetricCard } from "@/components/admin/metric-card";
import { PendingReportsBanner } from "@/components/admin/pending-reports-banner";
import { ReportList } from "@/components/admin/moderation/report-list";

type SearchParams = Promise<{
  status?: string;
  reason?: string;
}>;

const STATUS_OPTIONS: (ReportStatus | "all")[] = [
  "pending",
  "actioned",
  "reviewed",
  "dismissed",
  "all",
];

const REASON_OPTIONS: (ReportReason | "all")[] = [
  "all",
  "inappropriate_photo",
  "offensive",
  "spam",
  "other",
];

const REASON_LABELS: Record<ReportReason | "all", string> = {
  all: "All reasons",
  inappropriate_photo: "Inappropriate photo",
  offensive: "Offensive",
  spam: "Spam",
  other: "Other",
};

function isStatus(v: string | undefined): v is ReportStatus | "all" {
  return v === undefined || STATUS_OPTIONS.includes(v as ReportStatus | "all");
}

function isReason(v: string | undefined): v is ReportReason | "all" {
  return v === undefined || REASON_OPTIONS.includes(v as ReportReason | "all");
}

export default async function ReportsQueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: ReportStatus | "all" = isStatus(params.status)
    ? (params.status ?? "pending")
    : "pending";
  const reason: ReportReason | "all" = isReason(params.reason)
    ? (params.reason ?? "all")
    : "all";

  const [counts, { reports }] = await Promise.all([
    getReportCounts(),
    getContentReports({ status, reason }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          Content Reports
        </h1>
        <Link
          href="/admin/moderation"
          className="px-4 py-2 rounded-sm text-sm font-medium bg-surface-2 text-text-primary hover:bg-surface-2/80 transition-colors"
        >
          Back to moderation
        </Link>
      </div>

      <PendingReportsBanner count={counts.pending} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pending" value={counts.pending} />
        <MetricCard title="Actioned" value={counts.actioned} />
        <MetricCard title="Reviewed" value={counts.reviewed} />
        <MetricCard title="Dismissed" value={counts.dismissed} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => {
            const next = new URLSearchParams();
            next.set("status", s);
            if (reason !== "all") next.set("reason", reason);
            return (
              <Link
                key={s}
                href={`/admin/moderation/reports?${next.toString()}`}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                  status === s
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-1 ml-auto">
          {REASON_OPTIONS.map((r) => {
            const next = new URLSearchParams();
            next.set("status", status);
            next.set("reason", r);
            return (
              <Link
                key={r}
                href={`/admin/moderation/reports?${next.toString()}`}
                className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${
                  reason === r
                    ? "bg-surface-2 text-text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                {REASON_LABELS[r]}
              </Link>
            );
          })}
        </div>
      </div>

      <ReportList reports={reports} />
    </div>
  );
}
