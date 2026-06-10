import type { LeaderboardHealth } from "@/lib/admin/analytics-queries";

type LeaderboardHealthProps = {
  health: LeaderboardHealth;
};

export function LeaderboardHealthCard({ health }: LeaderboardHealthProps) {
  const { total_entries, high_confidence, medium_confidence, low_confidence } =
    health;

  const highPct =
    total_entries > 0 ? Math.round((high_confidence / total_entries) * 100) : 0;
  const medPct =
    total_entries > 0
      ? Math.round((medium_confidence / total_entries) * 100)
      : 0;
  const lowPct =
    total_entries > 0 ? Math.round((low_confidence / total_entries) * 100) : 0;

  return (
    <div className="bg-surface border border-border rounded-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Leaderboard Health
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total Entries</span>
          <span className="text-text-primary font-semibold">
            {total_entries.toLocaleString()}
          </span>
        </div>

        {/* Bar visualization */}
        <div className="h-4 rounded-pill overflow-hidden flex bg-bg">
          {highPct > 0 && (
            <div
              className="bg-success transition-all"
              style={{ width: `${highPct}%` }}
            />
          )}
          {medPct > 0 && (
            <div
              className="bg-warning transition-all"
              style={{ width: `${medPct}%` }}
            />
          )}
          {lowPct > 0 && (
            <div
              className="bg-danger transition-all"
              style={{ width: `${lowPct}%` }}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <div>
              <p className="text-text-primary font-medium">{high_confidence}</p>
              <p className="text-xs text-text-secondary">High ({highPct}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning" />
            <div>
              <p className="text-text-primary font-medium">
                {medium_confidence}
              </p>
              <p className="text-xs text-text-secondary">Medium ({medPct}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger" />
            <div>
              <p className="text-text-primary font-medium">{low_confidence}</p>
              <p className="text-xs text-text-secondary">Low ({lowPct}%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
