import Link from "next/link";

type PendingReportsBannerProps = {
  count: number;
};

export function PendingReportsBanner({ count }: PendingReportsBannerProps) {
  if (count <= 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-danger/40 bg-danger/10">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-danger/20 text-danger animate-pulse">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {count} pending {count === 1 ? "report" : "reports"} awaiting review
          </p>
          <p className="text-xs text-text-secondary">
            User-reported content requires moderator action.
          </p>
        </div>
      </div>
      <Link
        href="/admin/moderation/reports"
        className="shrink-0 px-4 py-2 rounded-sm text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
      >
        Review now
      </Link>
    </div>
  );
}
