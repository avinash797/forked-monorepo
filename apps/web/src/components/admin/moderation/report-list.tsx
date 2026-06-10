import Link from "next/link";
import type {
  ContentReport,
  ReportReason,
  ReportStatus,
} from "@/lib/admin/report-queries";

type ReportListProps = {
  reports: ContentReport[];
};

const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate_photo: "Inappropriate photo",
  offensive: "Offensive",
  spam: "Spam",
  other: "Other",
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending: "bg-warning/15 text-warning",
  actioned: "bg-danger/15 text-danger",
  reviewed: "bg-success/15 text-success",
  dismissed: "bg-surface-2 text-text-secondary",
};

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No reports match these filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const rating = report.rating;
        const reportedUser = rating?.reported_user;
        const reporterHandle =
          report.reporter?.username ??
          report.reporter?.display_name ??
          "Anonymous";
        const reportedHandle =
          reportedUser?.username ??
          reportedUser?.display_name ??
          "Unknown user";

        return (
          <Link
            key={report.id}
            href={`/admin/moderation/reports/${report.id}`}
            className={`flex gap-4 p-4 bg-surface border border-border rounded-sm hover:bg-surface-2/50 transition-colors ${
              report.status === "pending"
                ? "border-l-4 border-l-danger"
                : ""
            }`}
          >
            <div className="shrink-0 w-20 h-20 rounded-sm overflow-hidden bg-surface-2">
              {rating?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rating.photo_url}
                  alt="Reported"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-tertiary text-xs">
                  No photo
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-surface-2 text-text-primary">
                  {REASON_LABELS[report.reason]}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-pill ${STATUS_STYLES[report.status]}`}
                >
                  {report.status}
                </span>
                {reportedUser?.is_banned && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
                    banned
                  </span>
                )}
                {reportedUser && reportedUser.warn_count > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-warning/15 text-warning">
                    {reportedUser.warn_count}× warned
                  </span>
                )}
              </div>

              {report.description && (
                <p className="text-sm text-text-secondary mb-1 line-clamp-1">
                  &ldquo;{report.description}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>
                  Reported by{" "}
                  <span className="text-text-primary">{reporterHandle}</span>
                </span>
                <span>&middot;</span>
                <span>
                  Target{" "}
                  <span className="text-text-primary">{reportedHandle}</span>
                </span>
                {rating && (
                  <>
                    <span>&middot;</span>
                    <span className="truncate">
                      {rating.dish_type_name} @ {rating.restaurant_name}
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-text-tertiary mt-1">
                {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
