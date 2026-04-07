import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getContentReportById,
  getUserReportHistory,
  type ReportReason,
  type ReportStatus,
} from "@/lib/admin/report-queries";
import { ReportActionsPanel } from "@/components/admin/moderation/report-actions-panel";
import { RepeatOffenderBadge } from "@/components/admin/moderation/repeat-offender-badge";

type Params = Promise<{ id: string }>;

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

export default async function ReportDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const report = await getContentReportById(id);

  if (!report) {
    notFound();
  }

  const rating = report.rating;
  const reportedUser = rating?.reported_user ?? null;
  const history = reportedUser
    ? await getUserReportHistory(reportedUser.id, report.id)
    : null;

  const reporterHandle =
    report.reporter?.username ??
    report.reporter?.display_name ??
    "Anonymous";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/moderation/reports"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Back to reports
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">
            Report Detail
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-surface-2 text-text-primary">
            {REASON_LABELS[report.reason]}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-pill ${STATUS_STYLES[report.status]}`}
          >
            {report.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reported content (photo + rating context) */}
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <div className="aspect-square bg-surface-2">
            {rating?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rating.photo_url}
                alt="Reported"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                {rating ? "Photo has been removed" : "Rating has been deleted"}
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            {rating ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {rating.restaurant_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {rating.dish_type_name}
                    {rating.derived_score != null && (
                      <> &middot; score {rating.derived_score}/10</>
                    )}
                  </p>
                </div>
                {rating.notes && (
                  <p className="text-sm text-text-secondary italic">
                    &ldquo;{rating.notes}&rdquo;
                  </p>
                )}
                {rating.created_at && (
                  <p className="text-xs text-text-tertiary">
                    Rated {new Date(rating.created_at).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                The rating this report targets no longer exists.
              </p>
            )}
          </div>
        </div>

        {/* Report context + user info */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-sm p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Report
            </h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Reason</dt>
                <dd className="text-text-primary">
                  {REASON_LABELS[report.reason]}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Filed</dt>
                <dd className="text-text-primary">
                  {new Date(report.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Reporter</dt>
                <dd className="text-text-primary">{reporterHandle}</dd>
              </div>
            </dl>
            {report.description && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-secondary mb-1">
                  Reporter&apos;s description
                </p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-sm p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Reported user
            </h3>
            {reportedUser ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {reportedUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reportedUser.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-sm text-text-secondary">
                      {(
                        reportedUser.display_name ||
                        reportedUser.username ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/users/${reportedUser.id}`}
                      className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                    >
                      {reportedUser.display_name || "Unnamed User"}
                    </Link>
                    {reportedUser.username && (
                      <p className="text-xs text-text-secondary">
                        @{reportedUser.username}
                      </p>
                    )}
                  </div>
                </div>
                {history && (
                  <RepeatOffenderBadge
                    priorReportCount={history.priorReportCount}
                    priorActionCount={history.priorActionCount}
                    isBanned={reportedUser.is_banned}
                    warnCount={reportedUser.warn_count}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                Unable to load reported user.
              </p>
            )}
          </div>
        </div>
      </div>

      <ReportActionsPanel report={report} currentAdminId={admin.id} />
    </div>
  );
}
