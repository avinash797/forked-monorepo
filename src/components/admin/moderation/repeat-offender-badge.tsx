type RepeatOffenderBadgeProps = {
  priorReportCount: number;
  priorActionCount: number;
  isBanned: boolean;
  warnCount: number;
};

export function RepeatOffenderBadge({
  priorReportCount,
  priorActionCount,
  isBanned,
  warnCount,
}: RepeatOffenderBadgeProps) {
  const isRepeat = priorReportCount >= 3 || priorActionCount >= 1;

  if (!isRepeat && warnCount === 0 && !isBanned) {
    return (
      <span className="text-xs text-text-secondary">No prior history</span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isRepeat && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
          Repeat offender
        </span>
      )}
      {isBanned && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
          Banned
        </span>
      )}
      {warnCount > 0 && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-warning/15 text-warning">
          {warnCount}× warned
        </span>
      )}
      {priorReportCount > 0 && (
        <span className="text-xs text-text-secondary">
          {priorReportCount} prior{" "}
          {priorReportCount === 1 ? "report" : "reports"}
        </span>
      )}
      {priorActionCount > 0 && (
        <span className="text-xs text-text-secondary">
          {priorActionCount} prior{" "}
          {priorActionCount === 1 ? "action" : "actions"}
        </span>
      )}
    </div>
  );
}
